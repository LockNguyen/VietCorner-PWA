import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Row Level Security is the only thing standing between one member and another member's data: the anon key
// ships in the browser, so anyone can query Supabase directly. These tests play the attacker.
//
// Why a separate command (`npm run test:rls`, not `npm test`): they talk to the real project, create two
// throwaway users and delete them again. They need SUPABASE_SERVICE_ROLE_KEY, which only exists locally.
//
// When you add a table, add a case here. A missing policy is silent: the app keeps working for its owner
// while everyone else's data leaks, or disappears.

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TestUser = { id: string; email: string; client: SupabaseClient };

// A signed-in user holding nothing but the public anon key: exactly what a browser has.
async function createTestUser(name: string): Promise<TestUser> {
  const email = `rls-${name}-${Date.now()}@example.com`;
  const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !created.user) throw error ?? new Error(`could not create ${email}`);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link) throw linkError ?? new Error(`could not get a login code for ${email}`);

  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInError } = await client.auth.verifyOtp({
    email,
    token: link.properties.email_otp,
    type: "email",
  });
  if (signInError) throw signInError;

  return { id: created.user.id, email, client };
}

let alice: TestUser;
let bob: TestUser;
let groupId: string;

beforeAll(async () => {
  [alice, bob] = await Promise.all([createTestUser("alice"), createTestUser("bob")]);

  const { data: group } = await admin.from("groups").select("id").limit(1).single();
  if (!group) throw new Error("no groups: run features/chat/schema.sql first");
  groupId = group.id;

  // Alice joins the group and posts; Bob stays outside it.
  await alice.client.from("group_members").insert({ group_id: groupId });
  await alice.client.from("messages").insert({ group_id: groupId, body: "alice's private message" });
  await alice.client
    .from("push_subscriptions")
    .insert({ endpoint: `https://push.test/${alice.id}`, subscription: { endpoint: "x" } });
}, 60_000);

afterAll(async () => {
  for (const user of [alice, bob]) {
    if (user) await admin.auth.admin.deleteUser(user.id); // cascades to their rows
  }
});

describe("messages", () => {
  it("are readable by a member of the group", async () => {
    const { data } = await alice.client.from("messages").select("body").eq("group_id", groupId);

    expect(data?.some((row) => row.body === "alice's private message")).toBe(true);
  });

  it("are invisible to someone who never joined the group", async () => {
    const { data, error } = await bob.client.from("messages").select("body").eq("group_id", groupId);

    // RLS hides rows rather than raising: a blocked read comes back empty.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("cannot be posted by a non-member", async () => {
    const { error } = await bob.client.from("messages").insert({ group_id: groupId, body: "sneaking in" });

    expect(error?.message).toMatch(/row-level security/i);
  });

  it("cannot be posted under someone else's name", async () => {
    const { error } = await alice.client
      .from("messages")
      .insert({ group_id: groupId, body: "pretending", sender_email: bob.email });

    expect(error?.message).toMatch(/row-level security/i);
  });
});

describe("group_members", () => {
  it("cannot be created on behalf of another user", async () => {
    const { error } = await bob.client.from("group_members").insert({ group_id: groupId, user_id: alice.id });

    expect(error?.message).toMatch(/row-level security/i);
  });
});

describe("push_subscriptions", () => {
  it("are invisible to other users", async () => {
    const { data } = await bob.client.from("push_subscriptions").select("endpoint");

    expect(data).toEqual([]);
  });

  it("are visible to their owner", async () => {
    const { data } = await alice.client.from("push_subscriptions").select("endpoint");

    expect(data).toHaveLength(1);
  });
});

describe("document_chunks (server-only table)", () => {
  it("is unreachable with the anon key, even for a signed-in user", async () => {
    const { data, error } = await alice.client.from("document_chunks").select("id").limit(1);

    // No grants and no policies: the request fails outright or returns nothing.
    expect(error ?? data).not.toBeNull();
    expect(data ?? []).toEqual([]);
  });
});

describe("auth.users", () => {
  it("is not exposed through the API at all", async () => {
    const { error } = await alice.client.from("users").select("id").limit(1);

    expect(error).not.toBeNull();
  });
});

describe("user_settings (i18n)", () => {
  it("is written and read back by its owner", async () => {
    await alice.client.from("user_settings").upsert({ language: "en" }, { onConflict: "user_id" });
    const { data } = await alice.client.from("user_settings").select("language").maybeSingle();

    expect(data?.language).toBe("en");
  });

  it("is invisible to another user", async () => {
    const { data } = await bob.client.from("user_settings").select("language");

    expect(data).toEqual([]);
  });

  it("cannot be written on behalf of another user", async () => {
    const { error } = await bob.client
      .from("user_settings")
      .insert({ user_id: alice.id, language: "en" });

    expect(error?.message).toMatch(/row-level security/i);
  });

  it("rejects a language the app does not ship", async () => {
    const { error } = await alice.client
      .from("user_settings")
      .upsert({ language: "fr" }, { onConflict: "user_id" });

    expect(error).not.toBeNull(); // the check constraint, not the app, is what guarantees this
  });
});

describe("events", () => {
  // Alice is a member of the seeded group; Bob never joined it. The admin client stands in for the admin
  // page, which does not exist yet.
  let churchWideId: string;
  let groupOnlyId: string;
  let deletedId: string;

  beforeAll(async () => {
    const rows = [
      { starts_at: new Date(Date.now() + 86_400_000).toISOString(), created_by: alice.id },
      { starts_at: new Date(Date.now() + 86_400_000).toISOString(), created_by: alice.id, group_id: groupId },
      {
        starts_at: new Date(Date.now() + 86_400_000).toISOString(),
        created_by: alice.id,
        deleted_at: new Date().toISOString(),
      },
    ];
    const { data, error } = await admin.from("events").insert(rows).select("id");
    if (error || !data) throw error ?? new Error("could not seed events");
    [churchWideId, groupOnlyId, deletedId] = data.map((row) => row.id);

    await admin.from("event_texts").insert(
      data.map((row) => ({ event_id: row.id, language: "en", title: `test ${row.id.slice(0, 8)}` })),
    );
    await admin.from("event_reminders").insert({ event_id: churchWideId, minutes_before: 60 });
  }, 60_000);

  afterAll(async () => {
    await admin.from("events").delete().in("id", [churchWideId, groupOnlyId, deletedId]);
  });

  it("church-wide events are visible to every signed-in member", async () => {
    const { data } = await bob.client.from("events").select("id").eq("id", churchWideId);

    expect(data).toHaveLength(1);
  });

  it("a group's events are hidden from everyone outside that group", async () => {
    const { data: forMember } = await alice.client.from("events").select("id").eq("id", groupOnlyId);
    const { data: forOutsider } = await bob.client.from("events").select("id").eq("id", groupOnlyId);

    expect(forMember).toHaveLength(1);
    expect(forOutsider).toEqual([]);
  });

  it("a soft-deleted event is invisible, even queried directly", async () => {
    const { data } = await alice.client.from("events").select("id").eq("id", deletedId);

    expect(data).toEqual([]);
  });

  it("members cannot write events", async () => {
    const { error } = await alice.client
      .from("events")
      .insert({ starts_at: new Date().toISOString() });

    expect(error).not.toBeNull(); // no insert grant until the admin feature exists
  });

  it("reminders never reach a member's device", async () => {
    const { data, error } = await alice.client.from("event_reminders").select("minutes_before");

    expect(error ?? data).not.toBeNull();
    expect(data ?? []).toEqual([]);
  });
});


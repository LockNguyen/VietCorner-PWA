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

// Makes `user` a member of a group the way an approval does: with the service role. Members cannot add
// themselves any more; the "joining a group" tests below cover the request and the approval.
async function makeMember(user: TestUser, memberOfGroupId: string) {
  const { error } = await admin.from("group_members").insert({ group_id: memberOfGroupId, user_id: user.id });
  if (error) throw error;
}

let alice: TestUser;
let bob: TestUser;
let groupId: string;

beforeAll(async () => {
  [alice, bob] = await Promise.all([createTestUser("alice"), createTestUser("bob")]);

  const { data: group } = await admin.from("groups").select("id").limit(1).single();
  if (!group) throw new Error("no groups: run features/groups/schema.sql first");
  groupId = group.id;

  // Alice joins the group and posts; Bob stays outside it.
  await makeMember(alice, groupId);
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
  it("cannot be created by a member, for themselves or anyone else: the way in is an approval", async () => {
    const { error: forSelf } = await bob.client.from("group_members").insert({ group_id: groupId });
    const { error: forOther } = await bob.client.from("group_members").insert({ group_id: groupId, user_id: alice.id });

    expect([forSelf, forOther].every((error) => error !== null)).toBe(true);
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

describe("permissions", () => {
  // Alice is made an admin for these tests and refreshes her token, which is when the hook writes her
  // permissions into it. Bob stays a member.
  let createdGroupId: string | undefined;

  beforeAll(async () => {
    await admin.from("user_roles").insert({ user_id: alice.id, role: "admin" });
    await alice.client.auth.refreshSession();

    const { data } = await alice.client.auth.getClaims();
    if (!Array.isArray(data?.claims.permissions)) {
      throw new Error(
        "Alice's token has no `permissions` claim. Switch the hook on: Dashboard → Authentication → Hooks → " +
          "Custom Access Token → public.custom_access_token_hook",
      );
    }
  }, 60_000);

  afterAll(async () => {
    if (createdGroupId) await admin.from("groups").delete().eq("id", createdGroupId);
  });

  it("reach a user through their login token", async () => {
    const { data: forAdmin } = await alice.client.auth.getClaims();
    const { data: forMember } = await bob.client.auth.getClaims();

    expect(forAdmin?.claims.permissions).toContain("groups.manage");
    expect(forMember?.claims.permissions ?? []).toEqual([]);
  });

  it("cannot be read or granted by a member, who could otherwise make themselves admin", async () => {
    const { error: readError } = await bob.client.from("user_roles").select("role");
    const { error: grantError } = await bob.client.from("user_roles").insert({ user_id: bob.id, role: "admin" });
    const { error: defineError } = await bob.client
      .from("role_permissions")
      .insert({ role: "member", permission: "groups.manage" });

    expect([readError, grantError, defineError].every((error) => error !== null)).toBe(true);
  });

  it("let someone with groups.manage create and rename a group", async () => {
    const name = `rls test ${Date.now()}`;
    const { error: createError } = await alice.client.from("groups").insert({ name });
    const { data: created } = await admin.from("groups").select("id").eq("name", name).single();
    createdGroupId = created?.id;
    const { error: renameError } = await alice.client.from("groups").update({ name: `${name} renamed` }).eq("id", createdGroupId);
    const { data: renamed } = await admin.from("groups").select("name").eq("id", createdGroupId).single();

    expect([createError, renameError]).toEqual([null, null]);
    expect(renamed?.name).toBe(`${name} renamed`);
  });

  it("joining a group: a member asks, only a manager lets them in", async () => {
    // Bob asks to join the group Alice (a manager by now) created in the test above.
    if (!createdGroupId) throw new Error("the group from the previous test is missing");
    const { error: askError } = await bob.client.from("group_join_requests").insert({ group_id: createdGroupId });
    const { data: ownRequest } = await bob.client.from("group_join_requests").select("user_email");
    const { data: selfApproved } = await bob.client.rpc("approve_join_request", { group_id: createdGroupId, user_id: bob.id });
    const { data: beforeApproval } = await bob.client.from("group_members").select("group_id").eq("group_id", createdGroupId);

    const { data: seenByManager } = await alice.client.from("group_join_requests").select("user_id").eq("group_id", createdGroupId);
    const { data: approved } = await alice.client.rpc("approve_join_request", { group_id: createdGroupId, user_id: bob.id });
    const { data: afterApproval } = await bob.client.from("group_members").select("group_id").eq("group_id", createdGroupId);
    const { data: leftOver } = await admin.from("group_join_requests").select("user_id").eq("group_id", createdGroupId);
    await admin.from("group_members").delete().eq("group_id", createdGroupId).eq("user_id", bob.id); // the next test adds him itself

    expect(askError).toBeNull();
    expect(ownRequest).toEqual([{ user_email: bob.email }]);
    expect(selfApproved).toBe(false); // asking is not getting
    expect(beforeApproval).toEqual([]);
    expect(seenByManager).toEqual([{ user_id: bob.id }]);
    expect(approved).toBe(true);
    expect(afterApproval).toHaveLength(1);
    expect(leftOver).toEqual([]); // the request became the membership
  });

  it("stop a member from creating, renaming or removing a group", async () => {
    const { error } = await bob.client.from("groups").insert({ name: "bob's group" });
    await bob.client.from("groups").update({ name: "defaced" }).eq("id", groupId);
    await bob.client.from("groups").update({ deleted_at: new Date().toISOString() }).eq("id", groupId);
    const { data: untouched } = await admin.from("groups").select("name, deleted_at").eq("id", groupId).single();

    expect(error).not.toBeNull();
    expect(untouched?.name).not.toBe("defaced");
    expect(untouched?.deleted_at).toBeNull();
  });

  it("a removed group goes quiet for its members, and nothing in it is erased", async () => {
    // Bob joins the group Alice made and posts; then Alice, who may manage groups, removes it.
    if (!createdGroupId) throw new Error("the group from the previous test is missing");
    await makeMember(bob, createdGroupId);
    await bob.client.from("messages").insert({ group_id: createdGroupId, body: "before the group was removed" });
    const { error: removeError } = await alice.client
      .from("groups")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", createdGroupId);

    const { data: listed } = await bob.client.from("groups").select("id").eq("id", createdGroupId);
    const { data: readable } = await bob.client.from("messages").select("id").eq("group_id", createdGroupId);
    const { error: postError } = await bob.client.from("messages").insert({ group_id: createdGroupId, body: "after" });
    const { data: kept } = await admin.from("messages").select("body").eq("group_id", createdGroupId);

    expect(removeError).toBeNull();
    expect(listed).toEqual([]);
    expect(readable).toEqual([]);
    expect(postError).not.toBeNull();
    expect(kept).toEqual([{ body: "before the group was removed" }]);
  });
});

describe("push cooldowns (server-only)", () => {
  it("cannot be read or reset by a member, who could otherwise silence or spam someone", async () => {
    const { data, error } = await alice.client.from("push_cooldowns").select("topic");
    const { error: claimError } = await alice.client.rpc("claim_push_turns", {
      user_ids: [bob.id],
      topic: "prayer",
      pause_seconds: 0,
    });

    expect(error).not.toBeNull();
    expect(data).toBeNull();
    expect(claimError).not.toBeNull();
  });

  it("keep the send-once ledger out of members' reach, and send each key once", async () => {
    const key = `rls-test:${Date.now()}`;
    const { error: readError } = await alice.client.from("push_sent_once").select("key");
    const { error: claimError } = await alice.client.rpc("claim_push_once", { key });
    const { data: first } = await admin.rpc("claim_push_once", { key });
    const { data: second } = await admin.rpc("claim_push_once", { key });
    await admin.from("push_sent_once").delete().eq("key", key);

    expect([readError, claimError].every((error) => error !== null)).toBe(true);
    expect([first, second]).toEqual([true, false]);
  });

  it("give each user one turn per topic per pause", async () => {
    const claim = async (topic: string, pauseSeconds = 60) => {
      const { data, error } = await admin.rpc("claim_push_turns", {
        user_ids: [alice.id, bob.id],
        topic,
        pause_seconds: pauseSeconds,
      });
      if (error) throw error;
      return (data as string[]).sort();
    };
    const both = [alice.id, bob.id].sort();

    expect(await claim("test:one")).toEqual(both); // first notification goes out
    expect(await claim("test:one")).toEqual([]); // a second inside the minute does not
    expect(await claim("test:two")).toEqual(both); // another topic is not affected
    expect(await claim("test:one", 0)).toEqual(both); // and once the pause is over, it goes out again
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

describe("profiles", () => {
  const standIn = (user: TestUser) => user.email.split("@")[0];

  it("exist for every account from the moment it is made, named after the email until the person is asked", async () => {
    const { data } = await alice.client.from("profiles").select("name, named_at").eq("user_id", alice.id).single();

    expect(data).toEqual({ name: standIn(alice), named_at: null });
  });

  it("are read by any signed-in user, and by nobody signed out", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: asBob } = await bob.client.from("profiles").select("name").eq("user_id", alice.id);
    const { data: signedOut } = await anonymous.from("profiles").select("name");

    expect(asBob).toEqual([{ name: standIn(alice) }]);
    expect(signedOut ?? []).toEqual([]);
  });

  it("are changed by their owner, and by nobody else", async () => {
    const { error: own } = await bob.client.from("profiles").update({ name: "Bob" }).eq("user_id", bob.id);
    await bob.client.from("profiles").update({ name: "Hacked" }).eq("user_id", alice.id); // RLS: matches no row
    const { data } = await admin.from("profiles").select("user_id, name").in("user_id", [alice.id, bob.id]);

    expect(own).toBeNull();
    expect(data?.find((row) => row.user_id === bob.id)?.name).toBe("Bob");
    expect(data?.find((row) => row.user_id === alice.id)?.name).toBe(standIn(alice));
  });

  it("cannot be moved onto another account, created or deleted by a user", async () => {
    const { error: moved } = await bob.client.from("profiles").update({ user_id: alice.id }).eq("user_id", bob.id);
    const { error: created } = await bob.client.from("profiles").insert({ user_id: bob.id, name: "Second" });
    const { error: deleted } = await bob.client.from("profiles").delete().eq("user_id", bob.id);

    expect([moved, created, deleted].every((error) => error !== null)).toBe(true);
  });

  it("refuse an empty name", async () => {
    const { error } = await bob.client.from("profiles").update({ name: "   " }).eq("user_id", bob.id);

    expect(error).not.toBeNull();
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

  it("a soft-deleted event is invisible to a member, even queried directly", async () => {
    const { data } = await bob.client.from("events").select("id").eq("id", deletedId);

    expect(data).toEqual([]);
  });

  it("members cannot create, cancel or remove events", async () => {
    const { error: createError } = await bob.client.from("events").insert({ starts_at: new Date().toISOString() });
    const { error: weekError } = await bob.client
      .from("event_cancellations")
      .insert({ event_id: churchWideId, occurrence_date: "2030-01-01" });
    // An update a member may not make is not an error: it matches no row. The cancel route relies on that.
    const { data: canceled } = await bob.client
      .from("events")
      .update({ canceled_at: new Date().toISOString() })
      .eq("id", churchWideId)
      .select("id");
    await bob.client.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", churchWideId);
    const { data: untouched } = await admin.from("events").select("canceled_at, deleted_at").eq("id", churchWideId).single();

    expect([createError, weekError].every((error) => error !== null)).toBe(true);
    expect(canceled).toEqual([]);
    expect(untouched).toEqual({ canceled_at: null, deleted_at: null });
  });

  it("someone with events.manage runs an event from creation to removal", async () => {
    // Alice was made an admin in the permissions tests above; her token carries events.manage.
    const { data: created, error: createError } = await alice.client
      .from("events")
      .insert({ starts_at: new Date(Date.now() + 86_400_000).toISOString(), repeats_weekly: true })
      .select("id, created_by")
      .single();
    if (createError || !created) throw createError ?? new Error("the manager could not create an event");

    const { error: textError } = await alice.client
      .from("event_texts")
      .upsert({ event_id: created.id, language: "vi", title: "Buổi nhóm thử nghiệm" });
    const { error: weekError } = await alice.client
      .from("event_cancellations")
      .insert({ event_id: created.id, occurrence_date: "2030-01-01" });
    const { data: asMember } = await bob.client.from("event_texts").select("title").eq("event_id", created.id);
    // Undo: only a manager can take a cancellation back. A member's delete is not an error; it matches no row.
    const { data: undoneByMember } = await bob.client
      .from("event_cancellations")
      .delete()
      .eq("event_id", created.id)
      .select("event_id");
    const { data: undone } = await alice.client
      .from("event_cancellations")
      .delete()
      .eq("event_id", created.id)
      .select("event_id");
    const { data: removed } = await alice.client
      .from("events")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", created.id)
      .select("id");
    const { data: afterRemoval } = await bob.client.from("events").select("id").eq("id", created.id);
    const { data: kept } = await admin.from("events").select("id").eq("id", created.id);
    await admin.from("events").delete().eq("id", created.id);

    expect(created.created_by).toBe(alice.id); // from her token; the column cannot be sent
    expect([textError, weekError]).toEqual([null, null]);
    expect(asMember).toEqual([{ title: "Buổi nhóm thử nghiệm" }]); // Vietnamese arrives intact
    expect(undoneByMember).toEqual([]);
    expect(undone).toHaveLength(1);
    expect(removed).toHaveLength(1);
    expect(afterRemoval).toEqual([]); // gone for members
    expect(kept).toHaveLength(1); // kept in the database
  });

  it("reminders are chosen by someone with events.manage, and never reach a member's device", async () => {
    // The setup above stored one reminder with the service role, so "no rows" for Bob means hidden.
    const { data: asMember } = await bob.client.from("event_reminders").select("minutes_before");
    const { error: memberAdds } = await bob.client.from("event_reminders").insert({ event_id: churchWideId, minutes_before: 30 });
    const { data: asManager } = await alice.client.from("event_reminders").select("minutes_before").eq("event_id", churchWideId);
    const { error: managerAdds } = await alice.client.from("event_reminders").insert({ event_id: churchWideId, minutes_before: 30 });

    expect(asMember).toEqual([]);
    expect(memberAdds).not.toBeNull();
    expect(asManager).toEqual([{ minutes_before: 60 }]);
    expect(managerAdds).toBeNull();
  });
});

describe("prayer requests", () => {
  // Alice and Bob share a second group here; Carol-style outsiders are played by Bob in Alice's first group,
  // which he never joined. The admin client reads the truth the members are not allowed to see.
  let sharedGroupId: string;
  let namedId: string;
  let anonymousId: string;
  let outsideBobsGroupsId: string;

  async function feedOf(user: TestUser) {
    const { data, error } = await user.client.from("prayer_feed").select("*");
    if (error) throw error;
    return data;
  }

  async function prayerCount(requestId: string) {
    const { data } = await admin.from("prayer_requests").select("prayer_count").eq("id", requestId).single();
    return data?.prayer_count;
  }

  beforeAll(async () => {
    const { data: other } = await admin.from("groups").select("id").neq("id", groupId).limit(1).single();
    if (!other) throw new Error("needs two groups: run features/groups/schema.sql first");
    sharedGroupId = other.id;
    await makeMember(alice, sharedGroupId);
    await makeMember(bob, sharedGroupId);

    // Posted through the same door the app uses, so the grants and defaults are part of what is tested.
    const posted = await Promise.all([
      alice.client.from("prayer_requests").insert({ group_id: sharedGroupId, body: "named request" }),
      alice.client
        .from("prayer_requests")
        .insert({ group_id: sharedGroupId, body: "anonymous request", is_anonymous: true }),
      alice.client.from("prayer_requests").insert({ group_id: groupId, body: "not for bob" }),
    ]);
    const failed = posted.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const { data: rows } = await admin.from("prayer_requests").select("id, body").eq("author_id", alice.id);
    const idOf = (body: string) => {
      const row = rows?.find((candidate) => candidate.body === body);
      if (!row) throw new Error(`request "${body}" was not saved`);
      return row.id as string;
    };
    [namedId, anonymousId, outsideBobsGroupsId] = [idOf("named request"), idOf("anonymous request"), idOf("not for bob")];
  }, 60_000);

  it("are read by members of the group, and nobody outside it", async () => {
    const ids = (await feedOf(bob)).map((request) => request.id);

    expect(ids).toContain(namedId);
    expect(ids).not.toContain(outsideBobsGroupsId);
  });

  it("hide the author of an anonymous request from other members", async () => {
    const feed = await feedOf(bob);
    const anonymous = feed.find((request) => request.id === anonymousId);
    const named = feed.find((request) => request.id === namedId);

    expect(named?.author_name).toBe(alice.email.split("@")[0]); // her stand-in name: she was never asked
    expect(anonymous?.author_name).toBeNull();
    expect(anonymous?.is_mine).toBe(false);
    expect(JSON.stringify(anonymous)).not.toContain(alice.id); // no column carries the author's id
  });

  it("cannot be read from the table itself, which is where the author is stored", async () => {
    const { data, error } = await bob.client.from("prayer_requests").select("author_id, author_email");

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("cannot be posted under someone else's name", async () => {
    const { error } = await bob.client
      .from("prayer_requests")
      .insert({ group_id: sharedGroupId, body: "forged", author_id: alice.id });

    expect(error).not.toBeNull();
  });

  it("cannot be posted to a group the author never joined", async () => {
    const { error } = await bob.client.from("prayer_requests").insert({ group_id: groupId, body: "intruder" });

    expect(error).not.toBeNull();
  });

  it("count a prayer from a fellow member, and show the number to nobody", async () => {
    const { data: counted } = await bob.client.rpc("pray_for_request", { request_id: namedId });

    expect(counted).toBe(true);
    expect(await prayerCount(namedId)).toBe(1);
    // The author hears the number in a notification; no member can read it, not even the author.
    expect((await feedOf(alice)).find((request) => request.id === namedId)).not.toHaveProperty("prayer_count");
  });

  it("do not count a prayer from outside the group, or from the author", async () => {
    const { data: fromOutside } = await bob.client.rpc("pray_for_request", { request_id: outsideBobsGroupsId });
    const { data: fromAuthor } = await alice.client.rpc("pray_for_request", { request_id: outsideBobsGroupsId });

    expect([fromOutside, fromAuthor]).toEqual([false, false]); // false is what stops the server notifying
    expect(await prayerCount(outsideBobsGroupsId)).toBe(0);
  });

  it("cannot have their count set directly", async () => {
    const { error } = await alice.client.from("prayer_requests").update({ prayer_count: 1000 }).eq("id", namedId);

    expect(error).not.toBeNull();
    expect(await prayerCount(namedId)).toBe(1);
  });

  it("can be edited by their author only, and only the words", async () => {
    await bob.client.from("prayer_requests").update({ body: "defaced" }).eq("id", namedId);
    await alice.client.from("prayer_requests").update({ body: "named request, edited" }).eq("id", namedId);
    const { error: notTheWords } = await alice.client
      .from("prayer_requests")
      .update({ is_anonymous: true })
      .eq("id", namedId);

    expect((await feedOf(bob)).find((request) => request.id === namedId)?.body).toBe("named request, edited");
    expect(notTheWords).not.toBeNull();
  });

  it("leave the feed when their author marks them answered, and stay in the database", async () => {
    await bob.client.from("prayer_requests").update({ answered_at: new Date().toISOString() }).eq("id", namedId);
    expect((await feedOf(alice)).map((request) => request.id)).toContain(namedId); // Bob's call did nothing

    await alice.client.from("prayer_requests").update({ answered_at: new Date().toISOString() }).eq("id", namedId);
    const { data: kept } = await admin.from("prayer_requests").select("answered_at").eq("id", namedId).single();

    expect((await feedOf(alice)).map((request) => request.id)).not.toContain(namedId);
    expect(kept?.answered_at).not.toBeNull(); // kept for the end-of-year look back
  });

  it("can be deleted for good by their author only", async () => {
    await bob.client.from("prayer_requests").delete().eq("id", outsideBobsGroupsId);
    const { data: stillThere } = await admin.from("prayer_requests").select("id").eq("id", outsideBobsGroupsId);
    expect(stillThere).toHaveLength(1);

    await alice.client.from("prayer_requests").delete().eq("id", outsideBobsGroupsId);
    const { data: gone } = await admin.from("prayer_requests").select("id").eq("id", outsideBobsGroupsId);
    expect(gone).toEqual([]);
  });

  it("removed by an admin disappear from every member's feed", async () => {
    await admin.from("prayer_requests").update({ deleted_at: new Date().toISOString() }).eq("id", anonymousId);

    expect((await feedOf(alice)).map((request) => request.id)).not.toContain(anonymousId);
  });

  it("reminders are set by someone with prayer.reminders, and never reach a member's device", async () => {
    // Alice holds the admin role by now; the seeds put reminders in the table, so "no rows" means hidden.
    const { data: asMember } = await bob.client.from("prayer_reminders").select("weekday");
    const { error: memberAdds } = await bob.client
      .from("prayer_reminders")
      .insert({ group_id: sharedGroupId, weekday: 6, send_at: "06:15" });
    const { error: managerAdds } = await alice.client
      .from("prayer_reminders")
      .insert({ group_id: sharedGroupId, weekday: 6, send_at: "06:15" });
    // The same group, day and time again is refused with the code the app turns into "already has a reminder".
    const { error: addedAgain } = await alice.client
      .from("prayer_reminders")
      .insert({ group_id: sharedGroupId, weekday: 6, send_at: "06:15" });
    const { data: stored } = await admin.from("prayer_reminders").select("id").eq("group_id", sharedGroupId).eq("weekday", 6);
    const { data: removed } = await alice.client
      .from("prayer_reminders")
      .delete()
      .eq("group_id", sharedGroupId)
      .eq("weekday", 6)
      .eq("send_at", "06:15")
      .select("id");

    expect(asMember).toEqual([]);
    expect(memberAdds).not.toBeNull();
    expect(managerAdds).toBeNull();
    expect(addedAgain?.code).toBe("23505");
    expect(stored).toHaveLength(1); // still one reminder, not two
    expect(removed).toHaveLength(1);
  });
});

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
// Approved the way an admin's tap does it (the role "member"), before signing in, so the token carries it.
// `waiting` leaves that out: an account nobody has let in yet.
async function createTestUser(name: string, { waiting = false } = {}): Promise<TestUser> {
  const email = `rls-${name}-${Date.now()}@example.com`;
  const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !created.user) throw error ?? new Error(`could not create ${email}`);
  if (!waiting) {
    const { error: roleError } = await admin.from("user_roles").insert({ user_id: created.user.id, role: "member" });
    if (roleError) throw roleError;
  }

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
let carol: TestUser; // signed up, not approved: what anyone with an email address can become
let groupId: string;

beforeAll(async () => {
  [alice, bob, carol] = await Promise.all([
    createTestUser("alice"),
    createTestUser("bob"),
    createTestUser("carol", { waiting: true }),
  ]);

  // An active group: a removed one would hide every membership in it, and with it half of these tests.
  const { data: group } = await admin.from("groups").select("id").is("deleted_at", null).limit(1).single();
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
  for (const user of [alice, bob, carol]) {
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
  it("cannot be created by a member, for themselves or anyone else: an admin puts people into groups", async () => {
    const { error: forSelf } = await bob.client.from("group_members").insert({ group_id: groupId });
    const { error: forOther } = await bob.client.from("group_members").insert({ group_id: groupId, user_id: alice.id });

    expect([forSelf, forOther].every((error) => error !== null)).toBe(true);
  });

  it("show a member their own rows only, and cannot be removed by a member", async () => {
    const { data: seenByBob } = await bob.client.from("group_members").select("user_id").eq("group_id", groupId);
    await bob.client.from("group_members").delete().eq("group_id", groupId).eq("user_id", alice.id);
    const { data: stillIn } = await admin.from("group_members").select("user_id").eq("group_id", groupId).eq("user_id", alice.id);

    expect(seenByBob).toEqual([]); // Alice is in that group; Bob is not, and sees nobody's membership
    expect(stillIn).toHaveLength(1);
  });
});

describe("my_groups, the group list's one read", () => {
  it("shows each caller their own standing, and nothing to someone signed out", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const standingIn = async (client: SupabaseClient) =>
      ((await client.rpc("my_groups")).data ?? []).find((group: { id: string }) => group.id === groupId);

    const signedOut = await anonymous.rpc("my_groups");

    expect(await standingIn(alice.client)).toMatchObject({ joined: true, pending: false });
    expect(await standingIn(alice.client)).toHaveProperty("member_count"); // the typed size, read by everyone
    expect(await standingIn(bob.client)).toMatchObject({ joined: false, pending: false });
    expect(signedOut.error).not.toBeNull();
  });
});

describe("account_exists, asked by the sign-in screen", () => {
  it("answers yes or no to someone signed out, whatever the case or spaces, and nothing more", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const ask = async (address: string) => (await anonymous.rpc("account_exists", { address })).data;

    expect(await ask(` ${alice.email.toUpperCase()} `)).toBe(true);
    expect(await ask(`nobody-${Date.now()}@example.com`)).toBe(false);
  });
});

describe("people: the Admin tab's list of everyone (people/schema.sql)", () => {
  it("lists nobody, and changes nothing, for a member without users.manage", async () => {
    const list = await bob.client.rpc("people_list");
    expect(list.data ?? []).toEqual([]);

    const promote = await bob.client.rpc("set_person_role", { user_id: bob.id, role: "admin", given: true });
    expect(promote.error).not.toBeNull();
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", bob.id);
    expect(roles?.map((row) => row.role)).not.toContain("admin");

    const remove = await bob.client.rpc("remove_person", { user_id: carol.id });
    expect(remove.error).not.toBeNull();
    const { data: still } = await admin.auth.admin.getUserById(carol.id);
    expect(still.user).not.toBeNull();
  });
});

describe("group cards: members' initials (group-info/schema.sql, section 7)", () => {
  it("are given to an approved member, and to nobody signed out", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: initials } = await bob.client.rpc("group_member_initials", { group_id: groupId });
    expect(Array.isArray(initials) && initials.length).toBeGreaterThan(0); // Alice is in it
    expect((await anonymous.rpc("group_member_initials", { group_id: groupId })).error).not.toBeNull();
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

  it("can be removed by their owner, which is how a device is turned off, and by nobody else", async () => {
    const endpoint = `https://push.test/${bob.id}-to-remove`;
    await admin.from("push_subscriptions").insert({ endpoint, user_id: bob.id, subscription: { endpoint } });

    await alice.client.from("push_subscriptions").delete().eq("endpoint", endpoint); // RLS: matches no row
    const { data: afterStranger } = await admin.from("push_subscriptions").select("endpoint").eq("endpoint", endpoint);
    const { error } = await bob.client.from("push_subscriptions").delete().eq("endpoint", endpoint);
    const { data: afterOwner } = await admin.from("push_subscriptions").select("endpoint").eq("endpoint", endpoint);

    expect(afterStranger).toHaveLength(1);
    expect(error).toBeNull();
    expect(afterOwner).toEqual([]);
  });

  it("cannot be taken over by the next person to sign in on that device: the server does that", async () => {
    // A shared phone keeps its endpoint when someone else signs in. The browser's own save then meets a row
    // it may not touch, which is why saving goes through /api/push/subscribe (the push README).
    const { error } = await bob.client
      .from("push_subscriptions")
      .upsert({ endpoint: `https://push.test/${alice.id}`, subscription: { endpoint: "y" } });
    const { data: owner } = await admin.from("push_subscriptions").select("user_id").eq("endpoint", `https://push.test/${alice.id}`).single();

    expect(error).not.toBeNull();
    expect(owner?.user_id).toBe(alice.id);
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
    expect(forMember?.claims.permissions).toEqual(["app.use"]); // what every approved member holds, and no more
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

  it("let someone with groups.manage say how many people a group has, and nobody else", async () => {
    // The same call the app makes: name and size together.
    const { error } = await alice.client.from("groups").update({ name: "rls sized", member_count: 12 }).eq("id", createdGroupId);
    await bob.client.from("groups").update({ member_count: 999 }).eq("id", createdGroupId);
    const { error: negative } = await alice.client.from("groups").update({ member_count: -1 }).eq("id", createdGroupId);
    const { data: stored } = await admin.from("groups").select("member_count").eq("id", createdGroupId).single();

    expect(error).toBeNull();
    expect(negative).not.toBeNull();
    expect(stored?.member_count).toBe(12);
  });

  it("let someone with groups.manage put a person into a group and take them out again", async () => {
    const membership = { group_id: createdGroupId, user_id: bob.id };
    const isIn = async () =>
      ((await admin.from("group_members").select("user_id").match(membership)).data ?? []).length === 1;

    const { error: addError } = await alice.client.from("group_members").insert(membership);
    const added = await isIn();
    const { data: seenByManager } = await alice.client.from("group_members").select("user_id").match(membership);
    const { error: removeError } = await alice.client.from("group_members").delete().match(membership);

    expect([addError, removeError]).toEqual([null, null]);
    expect(added).toBe(true);
    expect(seenByManager).toHaveLength(1); // a manager sees other people's memberships; a member does not
    expect(await isIn()).toBe(false);
  });

  it("group_people lists every approved account with its email and groups, for a manager only", async () => {
    type Row = { user_id: string; name: string; email: string; group_ids: string[] };
    const { data: forManager } = await alice.client.rpc("group_people");
    const { data: forMember } = await bob.client.rpc("group_people");
    const { data: forWaiting } = await carol.client.rpc("group_people");
    const find = (id: string) => (forManager as Row[] | null)?.find((row) => row.user_id === id);

    expect(find(alice.id)).toMatchObject({ email: alice.email });
    expect(find(alice.id)?.group_ids).toContain(groupId);
    expect(find(bob.id)).toMatchObject({ email: bob.email });
    expect(find(carol.id)).toBeUndefined(); // still waiting to be let in: not offered
    expect(forMember).toEqual([]); // emails are for managers
    expect(forWaiting).toEqual([]);
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
    // The manager who removed it may still read the row, but her group list does not offer it.
    const { data: managersList } = await alice.client.rpc("my_groups");
    expect((managersList ?? []).map((group: { id: string }) => group.id)).not.toContain(createdGroupId);
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

describe("sign_in_links (server-only table)", () => {
  it("cannot be read or written with the public key, signed in or not: it says whom a tapped link signs in", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const row = { key_hash: "b".repeat(64), attempt: "a".repeat(64), email: "x@example.com", expires_at: new Date().toISOString(), approved_at: new Date().toISOString() };

    for (const client of [anonymous, alice.client]) {
      const { data, error: readError } = await client.from("sign_in_links").select("email").limit(1);
      const { error: writeError } = await client.from("sign_in_links").insert(row);

      expect(readError).not.toBeNull();
      expect(data).toBeNull();
      expect(writeError).not.toBeNull();
    }
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

  it("are read by their owner and by nobody signed out", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: own } = await bob.client.from("profiles").select("name").eq("user_id", bob.id);
    const { data: signedOut } = await anonymous.from("profiles").select("name");

    expect(own).toHaveLength(1);
    expect(signedOut ?? []).toEqual([]);
  });

  it("are hidden from a signed-in stranger, and shown to someone in a group with their owner", async () => {
    const aliceAsSeenByBob = () => bob.client.from("profiles").select("name").eq("user_id", alice.id);

    const { data: asStranger } = await aliceAsSeenByBob();
    await makeMember(bob, groupId);
    const { data: asFellowMember } = await aliceAsSeenByBob();
    await admin.from("group_members").delete().eq("group_id", groupId).eq("user_id", bob.id); // as he was

    expect(asStranger).toEqual([]);
    expect(asFellowMember).toEqual([{ name: standIn(alice) }]);
  });

  it("are shown to someone who manages groups, whoever the owner is", async () => {
    // Alice was made an admin by the permissions tests above, and shares no group with Bob.
    const { data } = await alice.client.from("profiles").select("user_id").eq("user_id", bob.id);

    expect(data).toEqual([{ user_id: bob.id }]);
  });

  it("do not let anyone ask whether two other people share a group", async () => {
    const { data } = await bob.client.rpc("shares_a_group_with", { other: alice.id });

    expect(data).toBe(false); // it only ever answers about the caller, who shares none with her
  });

  it("cannot be changed directly, by their owner or anyone: the way is set_my_name", async () => {
    const { error: own } = await bob.client.from("profiles").update({ name: "Bob" }).eq("user_id", bob.id);
    const { error: other } = await bob.client.from("profiles").update({ name: "Hacked" }).eq("user_id", alice.id);
    const { error: moved } = await bob.client.from("profiles").update({ user_id: alice.id }).eq("user_id", bob.id);

    expect([own, other, moved].every((error) => error !== null)).toBe(true);
  });

  it("cannot be created or deleted by a user", async () => {
    const { error: created } = await bob.client.from("profiles").insert({ user_id: bob.id, name: "Second" });
    const { error: deleted } = await bob.client.from("profiles").delete().eq("user_id", bob.id);

    expect([created, deleted].every((error) => error !== null)).toBe(true);
  });
});

describe("changing a name", () => {
  const nameOf = async (user: TestUser) =>
    (await admin.from("profiles").select("name").eq("user_id", user.id).single()).data?.name;
  const requestOf = async (user: TestUser) =>
    (await admin.from("name_requests").select("name, user_email").eq("user_id", user.id).maybeSingle()).data;

  it("is immediate for someone in no group: nobody else reads the name yet", async () => {
    const { data: outcome } = await bob.client.rpc("set_my_name", { new_name: "  Bob  " });

    expect(outcome).toBe("saved");
    expect(await nameOf(bob)).toBe("Bob");
    expect(await requestOf(bob)).toBeNull();
  });

  it("refuses an empty name", async () => {
    const { error } = await bob.client.rpc("set_my_name", { new_name: "   " });

    expect(error).not.toBeNull();
    expect(await nameOf(bob)).toBe("Bob");
  });

  describe("for someone in a group", () => {
    beforeAll(async () => {
      await makeMember(bob, groupId);
    });

    afterAll(async () => {
      await admin.from("group_members").delete().eq("group_id", groupId).eq("user_id", bob.id); // as he was
      await admin.from("name_requests").delete().eq("user_id", bob.id);
    });

    it("becomes a request, with the account's email, and the name stays as it was", async () => {
      const { data: outcome } = await bob.client.rpc("set_my_name", { new_name: "Pastor John" });

      expect(outcome).toBe("requested");
      expect(await nameOf(bob)).toBe("Bob");
      expect(await requestOf(bob)).toEqual({ name: "Pastor John", user_email: bob.email });
    });

    it("is replaced by asking again: one request per person", async () => {
      await bob.client.rpc("set_my_name", { new_name: "Robert" });
      const { data } = await admin.from("name_requests").select("name").eq("user_id", bob.id);

      expect(data).toEqual([{ name: "Robert" }]);
    });

    it("cannot be approved, forged or removed by the person themselves", async () => {
      const { data: approved } = await bob.client.rpc("approve_name_request", { user_id: bob.id });
      const { error: forged } = await bob.client.from("name_requests").insert({ user_id: bob.id, user_email: "x@y.z", name: "Forged" });
      const { error: edited } = await bob.client.from("name_requests").update({ name: "Edited" }).eq("user_id", bob.id);
      await bob.client.from("name_requests").delete().eq("user_id", bob.id); // RLS: matches no row

      expect(approved).toBe(false);
      expect([forged, edited].every((error) => error !== null)).toBe(true);
      expect(await nameOf(bob)).toBe("Bob");
      expect((await requestOf(bob))?.name).toBe("Robert");
    });

    it("is seen by its owner and by a group manager", async () => {
      const { data: own } = await bob.client.from("name_requests").select("name");
      const { data: asManager } = await alice.client.from("name_requests").select("name").eq("user_id", bob.id);

      expect(own).toEqual([{ name: "Robert" }]);
      expect(asManager).toEqual([{ name: "Robert" }]);
    });

    it("becomes the name when a group manager approves it, once", async () => {
      const { data: approved } = await alice.client.rpc("approve_name_request", { user_id: bob.id });
      const { data: again } = await alice.client.rpc("approve_name_request", { user_id: bob.id });

      expect(approved).toBe(true);
      expect(again).toBe(false);
      expect(await nameOf(bob)).toBe("Robert");
      expect(await requestOf(bob)).toBeNull();
    });

    it("can be declined by a group manager, which leaves the name alone", async () => {
      await bob.client.rpc("set_my_name", { new_name: "Declined" });
      const { error } = await alice.client.from("name_requests").delete().eq("user_id", bob.id);

      expect(error).toBeNull();
      expect(await requestOf(bob)).toBeNull();
      expect(await nameOf(bob)).toBe("Robert");
    });
  });
});

describe("events", () => {
  // Every event is church-wide. One row still carries a group, as rows saved before 2026-10-12 do: Alice
  // is in that group and Bob is not, and it must make no difference. The admin client seeds the rows.
  let churchWideId: string;
  let groupOnlyId: string; // once for Alice's group only
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

  it("upcoming_events, the schedule's one read, returns what the policies allow and nothing more", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    // Windows as wide as they go: a caller choosing its own dates must not see more than a direct read.
    const everything = { until: "2999-01-01T00:00:00Z", cancelled_since: "1970-01-01T00:00:00Z" };
    const idsFor = async (client: SupabaseClient) =>
      ((await client.rpc("upcoming_events", everything)).data ?? []).map((row: { id: string }) => row.id);

    const [outsider, member, signedOut] = [await idsFor(bob.client), await idsFor(alice.client), await anonymous.rpc("upcoming_events", everything)];
    const { data: rows } = await bob.client.rpc("upcoming_events", everything);
    const churchWide = rows?.find((row: { id: string }) => row.id === churchWideId);

    expect(outsider).toContain(churchWideId);
    expect(outsider).toContain(groupOnlyId); // Bob is not in that group, and groups no longer limit events
    expect(member).toContain(groupOnlyId);
    expect([...outsider, ...member]).not.toContain(deletedId); // removed: hidden even from Alice, a manager
    expect(signedOut.error).not.toBeNull();
    expect(Object.keys(churchWide?.texts ?? {})).toEqual(["en"]);
    expect(churchWide?.canceled_dates).toEqual([]);
  });

  it("managed_events, the admin section's one read, gives a member no reminders and no more events than they may see", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    type Row = { id: string; reminder_minutes: number[]; texts: Record<string, unknown> };
    const rowsFor = async (client: SupabaseClient) => ((await client.rpc("managed_events")).data ?? []) as Row[];

    const [asManager, asMember, signedOut] = [await rowsFor(alice.client), await rowsFor(bob.client), await anonymous.rpc("managed_events")];
    const find = (rows: Row[], id: string) => rows.find((row) => row.id === id);

    // Alice manages events: every event that can still be managed, with its reminders and its words.
    expect(find(asManager, churchWideId)?.reminder_minutes).toContain(60);
    expect(Object.keys(find(asManager, churchWideId)?.texts ?? {})).toEqual(["en"]);
    expect(find(asManager, groupOnlyId)).toBeDefined();
    expect(find(asManager, deletedId)).toBeUndefined();
    // Bob is a member: the same events, and never a reminder.
    expect(find(asMember, churchWideId)?.reminder_minutes).toEqual([]);
    expect(find(asMember, groupOnlyId)?.reminder_minutes).toEqual([]);
    expect(signedOut.error).not.toBeNull();
  });

  it("have a contact phone number: a number only, set only by a manager, read by every member (3g)", async () => {
    const everything = { until: "2999-01-01T00:00:00Z", cancelled_since: "1970-01-01T00:00:00Z" };
    await bob.client.from("events").update({ contact_phone: "(336) 555-0199" }).eq("id", churchWideId);
    const { error: byManager } = await alice.client.from("events").update({ contact_phone: "(336) 555-0101" }).eq("id", churchWideId);
    const { error: notANumber } = await alice.client.from("events").update({ contact_phone: "sms:1234;body=hi" }).eq("id", churchWideId);
    const rows = (await bob.client.rpc("upcoming_events", everything)).data ?? [];

    expect(byManager).toBeNull();
    expect(notANumber).not.toBeNull();
    expect(rows.find((row: { id: string }) => row.id === churchWideId)?.contact_phone).toBe("(336) 555-0101");
  });

  it("are visible to every approved member", async () => {
    const { data } = await bob.client.from("events").select("id").eq("id", churchWideId);

    expect(data).toHaveLength(1);
  });

  it("once saved for one group are visible to everyone too: admins no longer limit an event", async () => {
    const { data: forMember } = await alice.client.from("events").select("id").eq("id", groupOnlyId);
    const { data: forOutsider } = await bob.client.from("events").select("id").eq("id", groupOnlyId);

    expect(forMember).toHaveLength(1);
    expect(forOutsider).toHaveLength(1);
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
    // The call api.ts makes, twice: switching a reminder on must work, and again when it is already on.
    const switchOn = () =>
      alice.client
        .from("event_reminders")
        .upsert({ event_id: churchWideId, minutes_before: 120 }, { onConflict: "event_id,minutes_before", ignoreDuplicates: true });
    const { error: switchedOn } = await switchOn();
    const { error: switchedOnAgain } = await switchOn();
    expect([switchedOn, switchedOnAgain]).toEqual([null, null]);

    expect(asMember).toEqual([]);
    expect(memberAdds).not.toBeNull();
    expect(asManager).toEqual([{ minutes_before: 60 }]);
    expect(managerAdds).toBeNull();
  });
});

describe("prayer requests", () => {
  // Every request is shared with the whole church: Alice writes, Bob reads, and they share no group.
  // Carol, still waiting to be let in, is the outsider. The admin client reads the truth the members are
  // not allowed to see.
  let namedId: string;
  let anonymousId: string;
  let thirdId: string;

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
    // Posted through the same door the app uses, so the grants and defaults are part of what is tested.
    const posted = await Promise.all([
      alice.client.from("prayer_requests").insert({ body: "named request" }),
      alice.client.from("prayer_requests").insert({ body: "anonymous request", is_anonymous: true }),
      alice.client.from("prayer_requests").insert({ body: "third request" }),
    ]);
    const failed = posted.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const { data: rows } = await admin.from("prayer_requests").select("id, body").eq("author_id", alice.id);
    const idOf = (body: string) => {
      const row = rows?.find((candidate) => candidate.body === body);
      if (!row) throw new Error(`request "${body}" was not saved`);
      return row.id as string;
    };
    [namedId, anonymousId, thirdId] = [idOf("named request"), idOf("anonymous request"), idOf("third request")];
  }, 60_000);

  it("are read by every approved member, whatever their groups, and by nobody still waiting", async () => {
    const ids = (await feedOf(bob)).map((request) => request.id);

    expect(ids).toEqual(expect.arrayContaining([namedId, anonymousId, thirdId]));
    expect(await feedOf(carol)).toEqual([]);
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
      .insert({ body: "forged", author_id: alice.id });

    expect(error).not.toBeNull();
  });

  it("cannot be limited to a group any more, or posted by someone still waiting", async () => {
    const { error: toAGroup } = await alice.client.from("prayer_requests").insert({ group_id: groupId, body: "for my group" });
    const { error: whileWaiting } = await carol.client.from("prayer_requests").insert({ body: "intruder" });

    expect(toAGroup).not.toBeNull();
    expect(whileWaiting).not.toBeNull();
  });

  it("count a prayer from a fellow member, and show the number to the author only", async () => {
    const { data: counted } = await bob.client.rpc("pray_for_request", { request_id: namedId });

    expect(counted).toBe(true);
    expect(await prayerCount(namedId)).toBe(1);
    // Section 5b: the author reads the count; everyone else gets null, so nobody compares requests.
    expect((await feedOf(alice)).find((request) => request.id === namedId)?.prayer_count).toBe(1);
    expect((await feedOf(bob)).find((request) => request.id === namedId)?.prayer_count).toBeNull();
  });

  it("do not count a prayer from someone still waiting, or from the author", async () => {
    const { data: fromOutside } = await carol.client.rpc("pray_for_request", { request_id: thirdId });
    const { data: fromAuthor } = await alice.client.rpc("pray_for_request", { request_id: thirdId });

    expect([fromOutside, fromAuthor]).toEqual([false, false]); // false is what stops the server notifying
    expect(await prayerCount(thirdId)).toBe(0);
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
    await bob.client.from("prayer_requests").delete().eq("id", thirdId);
    const { data: stillThere } = await admin.from("prayer_requests").select("id").eq("id", thirdId);
    expect(stillThere).toHaveLength(1);

    await alice.client.from("prayer_requests").delete().eq("id", thirdId);
    const { data: gone } = await admin.from("prayer_requests").select("id").eq("id", thirdId);
    expect(gone).toEqual([]);
  });

  it("removed by an admin disappear from every member's feed", async () => {
    await admin.from("prayer_requests").update({ deleted_at: new Date().toISOString() }).eq("id", anonymousId);

    expect((await feedOf(alice)).map((request) => request.id)).not.toContain(anonymousId);
  });

  it("reminders are set by someone with prayer.reminders, and never reach a member's device", async () => {
    // Alice holds the admin role by now; the seeds put reminders in the table, so "no rows" means hidden.
    const { data: asMember } = await bob.client.from("prayer_reminders").select("weekday");
    // The same call the app makes: a day and a time, for the whole church.
    const reminder = { weekday: 6, send_at: "06:15" };
    const { error: memberAdds } = await bob.client.from("prayer_reminders").insert(reminder);
    const { error: managerAdds } = await alice.client.from("prayer_reminders").insert(reminder);
    // The same day and time again is refused with the code the app turns into "there already is a reminder".
    const { error: addedAgain } = await alice.client.from("prayer_reminders").insert(reminder);
    // A reminder can no longer be given a group.
    const { error: forAGroup } = await alice.client.from("prayer_reminders").insert({ ...reminder, group_id: groupId });
    const { data: stored } = await admin.from("prayer_reminders").select("id").eq("weekday", 6).eq("send_at", "06:15");
    const { data: removed } = await alice.client
      .from("prayer_reminders")
      .delete()
      .is("group_id", null)
      .eq("weekday", 6)
      .eq("send_at", "06:15")
      .select("id");

    expect(asMember).toEqual([]);
    expect(memberAdds).not.toBeNull();
    expect(managerAdds).toBeNull();
    expect(addedAgain?.code).toBe("23505");
    expect(forAGroup).not.toBeNull();
    expect(stored).toHaveLength(1); // still one reminder, not two
    expect(removed).toHaveLength(1);
  });
});

describe("group_info: what a group says about itself", () => {
  // A group made for these tests, so no real group's words are overwritten. Bob is put into it part way;
  // Alice holds the admin role by now (groups.manage) and is NOT in it; Carol is still waiting to be let in.
  let ownGroupId: string;
  // The same call the app makes: one detail at a time, inserted, or updated if the row is there.
  const save = (user: TestUser, detail: { meets_at?: string; notes?: string }) =>
    user.client.from("group_info").upsert({ group_id: ownGroupId, ...detail }, { onConflict: "group_id" });
  const stored = async () =>
    (await admin.from("group_info").select("meets_at, notes").eq("group_id", ownGroupId).maybeSingle()).data;

  beforeAll(async () => {
    const { data, error } = await admin.from("groups").insert({ name: `rls group-info ${Date.now()}` }).select("id").single();
    if (error || !data) throw error ?? new Error("could not make a group");
    ownGroupId = data.id;
  }, 60_000);

  afterAll(async () => {
    await admin.from("groups").delete().eq("id", ownGroupId); // its details and memberships go with it
  });

  it("is not written by a member, not even one in the group: an admin says when and where a group meets", async () => {
    const { error: fromOutside } = await save(bob, { notes: "rls: not mine to write" });
    await makeMember(bob, ownGroupId);
    const { error: fromInside } = await save(bob, { notes: "rls: still not mine to write" });

    expect(fromOutside).not.toBeNull();
    expect(fromInside).not.toBeNull();
    expect(await stored()).toBeNull();
  });

  it("is written by a group manager, the first time and again, one detail at a time", async () => {
    const { error: first } = await save(alice, { notes: "rls: by an admin" });
    const { error: again } = await save(alice, { meets_at: "Fridays, 7:30 PM" });

    expect([first, again]).toEqual([null, null]);
    expect(await stored()).toEqual({ meets_at: "Fridays, 7:30 PM", notes: "rls: by an admin" }); // the second save kept the first
  });

  it("cannot be changed or erased by a member in the group, who cannot set its number of members either", async () => {
    await bob.client.from("group_info").update({ notes: "rls: defaced" }).eq("group_id", ownGroupId);
    await bob.client.from("group_info").delete().eq("group_id", ownGroupId);
    await bob.client.from("groups").update({ member_count: 999 }).eq("id", ownGroupId);
    const { data: group } = await admin.from("groups").select("member_count").eq("id", ownGroupId).single();

    expect(await stored()).toEqual({ meets_at: "Fridays, 7:30 PM", notes: "rls: by an admin" });
    expect(group?.member_count).toBeNull();
  });

  it("is read by every approved member through the page's one read, each with their own standing", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const rowFor = async (user: TestUser) =>
      ((await user.client.rpc("group_directory")).data ?? []).find((group: { id: string }) => group.id === ownGroupId);

    expect(await rowFor(bob)).toMatchObject({ is_member: true, notes: "rls: by an admin", meets_at: "Fridays, 7:30 PM" });
    expect(await rowFor(alice)).toMatchObject({ is_member: false, notes: "rls: by an admin" });
    expect((await anonymous.rpc("group_directory")).error).not.toBeNull();
  });

  it("has its name and place in English too, written only by a manager (group-info 8, groups 2e)", async () => {
    // The same two calls as the editor's one Save (group-info/api.ts `saveGroupInfo`).
    const saveBoth = (user: TestUser) =>
      Promise.all([
        user.client.from("groups").update({ name: "rls nhóm", name_en: "rls group", member_count: 5 }).eq("id", ownGroupId),
        user.client
          .from("group_info")
          .upsert({ group_id: ownGroupId, location: "rls hội trường", location_en: "rls hall" }, { onConflict: "group_id" }),
      ]);
    const [, fromMember] = await saveBoth(bob);
    const [renamed, placed] = await saveBoth(alice);
    const row = ((await bob.client.rpc("group_directory")).data ?? []).find((group: { id: string }) => group.id === ownGroupId);

    expect(fromMember.error).not.toBeNull();
    expect([renamed.error, placed.error]).toEqual([null, null]);
    expect(row).toMatchObject({ name: "rls nhóm", name_en: "rls group", location: "rls hội trường", location_en: "rls hall" });
  });

  it("has a contact phone number: a number only, written only by a manager (group-info 9)", async () => {
    const savePhone = (user: TestUser, contact_phone: string) =>
      user.client.from("group_info").upsert({ group_id: ownGroupId, contact_phone }, { onConflict: "group_id" });
    const { error: fromMember } = await savePhone(bob, "(336) 555-0199");
    const { error: byManager } = await savePhone(alice, "(336) 555-0101");
    const { error: notANumber } = await savePhone(alice, "javascript:alert(1)");
    const row = ((await bob.client.rpc("group_directory")).data ?? []).find((group: { id: string }) => group.id === ownGroupId);

    expect(fromMember).not.toBeNull();
    expect(byManager).toBeNull();
    expect(notANumber).not.toBeNull();
    expect(row).toMatchObject({ contact_phone: "(336) 555-0101" });
  });

  it("is closed to someone still waiting to be let in", async () => {
    const { data: direct } = await carol.client.from("group_info").select("notes");
    const { data: listed } = await carol.client.rpc("group_directory");
    const { error: writeError } = await save(carol, { notes: "rls: intruder" });

    expect(direct ?? []).toEqual([]);
    expect(listed ?? []).toEqual([]);
    expect(writeError).not.toBeNull();
  });
});

describe("group_photos: a group's pictures, and their files", () => {
  // A group made for these tests. Bob is in it; Alice is an admin outside it; Dora-like outsiders are played
  // by Bob in a second group he is NOT in; Carol is still waiting to be let in.
  const BUCKET = "group-photos";
  const jpeg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" }); // the smallest JPEG-shaped file
  let ownGroupId: string;
  let otherGroupId: string;
  const photoId = crypto.randomUUID();
  const pathIn = (group: string, id = photoId) => `${group}/${id}.jpg`;

  beforeAll(async () => {
    const { data, error } = await admin
      .from("groups")
      .insert([{ name: `rls photos ${Date.now()}` }, { name: `rls photos other ${Date.now()}` }])
      .select("id");
    if (error || !data) throw error ?? new Error("could not make the groups");
    [ownGroupId, otherGroupId] = data.map((row) => row.id);
    await makeMember(bob, ownGroupId);
  }, 60_000);

  afterAll(async () => {
    const { data: left } = await admin.storage.from(BUCKET).list(ownGroupId);
    if (left?.length) await admin.storage.from(BUCKET).remove(left.map((file) => `${ownGroupId}/${file.name}`));
    await admin.from("groups").delete().in("id", [ownGroupId, otherGroupId]); // their pictures' rows go with them
  });

  it("are added by someone in the group: the file, then the row, as the app does", async () => {
    const { error: uploadError } = await bob.client.storage.from(BUCKET).upload(pathIn(ownGroupId), jpeg(), { contentType: "image/jpeg" });
    const { error: rowError } = await bob.client
      .from("group_photos")
      .insert({ id: photoId, group_id: ownGroupId, taken_on: "2026-10-12", caption: "rls picnic" });
    const { data: stored } = await admin.from("group_photos").select("uploaded_by").eq("id", photoId).single();

    expect([uploadError, rowError]).toEqual([null, null]);
    expect(stored?.uploaded_by).toBe(bob.id); // from his login token: the browser cannot send it
  });

  it("cannot be added to a group the person is not in, as a file or as a row, or under another's name", async () => {
    const { error: uploadError } = await bob.client.storage.from(BUCKET).upload(pathIn(otherGroupId), jpeg(), { contentType: "image/jpeg" });
    const { error: rowError } = await bob.client.from("group_photos").insert({ group_id: otherGroupId });
    const { error: forged } = await bob.client.from("group_photos").insert({ group_id: ownGroupId, uploaded_by: alice.id });

    expect(uploadError).not.toBeNull();
    expect(rowError).not.toBeNull();
    expect(forged).not.toBeNull();
  });

  it("refuse a file that is not a JPEG, or is over 1 MB, whatever the browser claims", async () => {
    const bucket = bob.client.storage.from(BUCKET);
    const { error: notAPicture } = await bucket.upload(pathIn(ownGroupId, "script"), new Blob(["<script>"], { type: "text/html" }), { contentType: "text/html" });
    const { error: tooBig } = await bucket.upload(pathIn(ownGroupId, "big"), new Blob([new Uint8Array(1_100_000)], { type: "image/jpeg" }), { contentType: "image/jpeg" });

    expect(notAPicture).not.toBeNull();
    expect(tooBig).not.toBeNull();
  });

  it("are seen by every approved member, through an address that is signed for them", async () => {
    const { data: rows } = await alice.client.from("group_photos").select("id, caption").eq("group_id", ownGroupId);
    const { data: signed, error } = await alice.client.storage.from(BUCKET).createSignedUrls([pathIn(ownGroupId)], 60);
    const picture = await fetch(signed?.[0]?.signedUrl ?? "");
    // Without a signature the same file is not served: the bucket is private.
    const unsigned = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${pathIn(ownGroupId)}`);

    expect(rows).toEqual([{ id: photoId, caption: "rls picnic" }]);
    expect(error).toBeNull();
    expect(picture.status).toBe(200);
    expect(unsigned.ok).toBe(false);
  });

  it("are closed to someone still waiting to be let in, and to someone signed out", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    for (const client of [carol.client, anonymous]) {
      const { data: rows } = await client.from("group_photos").select("id");
      const { data: signed } = await client.storage.from(BUCKET).createSignedUrls([pathIn(ownGroupId)], 60);
      const { error: uploadError } = await client.storage.from(BUCKET).upload(pathIn(ownGroupId, "intruder"), jpeg(), { contentType: "image/jpeg" });

      expect(rows ?? []).toEqual([]);
      expect(signed?.[0]?.signedUrl ?? null).toBeNull();
      expect(uploadError).not.toBeNull();
    }
  });

  it("cannot be changed once added: there is no edit", async () => {
    const { error } = await bob.client.from("group_photos").update({ caption: "rewritten" }).eq("id", photoId);

    expect(error).not.toBeNull();
  });

  it("cannot be removed by a member, not even the one who added it: row and file stay", async () => {
    const { data: removed } = await bob.client.from("group_photos").delete().eq("id", photoId).select("id");
    await bob.client.storage.from(BUCKET).remove([pathIn(ownGroupId)]);
    const { data: left } = await admin.storage.from(BUCKET).list(ownGroupId);

    expect(removed).toEqual([]);
    expect(left?.map((file) => file.name)).toEqual([`${photoId}.jpg`]);
  });

  it("are removed by a group manager, row and file", async () => {
    const { data: removed } = await alice.client.from("group_photos").delete().eq("id", photoId).select("id");
    const { data: erased } = await alice.client.storage.from(BUCKET).remove([pathIn(ownGroupId)]);
    const { data: left } = await admin.storage.from(BUCKET).list(ownGroupId);

    expect(removed).toHaveLength(1);
    expect(erased).toHaveLength(1);
    expect(left ?? []).toEqual([]);
  });
});

describe("thumbnails: the picture that starts an event's row and a group's row", () => {
  // Alice holds the admin role by now (events.manage, groups.manage); Bob is a member; Carol is waiting.
  // One event and one group made for these tests. Each case runs for both: the two features follow one rule.
  const jpeg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" });
  const kinds = [
    { table: "events", bucket: "event-thumbnails" },
    { table: "groups", bucket: "group-thumbnails" },
  ];
  const ids: Record<string, string> = {};
  const pathFor = (table: string, name = "picture") => `${ids[table]}/${name}.jpg`;
  const storedPath = async (table: string) =>
    (await admin.from(table).select("thumbnail_path").eq("id", ids[table]).single()).data?.thumbnail_path;

  beforeAll(async () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    const { data: event } = await admin.from("events").insert({ starts_at: tomorrow }).select("id").single();
    const { data: group } = await admin.from("groups").insert({ name: `rls thumbnail ${Date.now()}` }).select("id").single();
    if (!event || !group) throw new Error("could not make the event and the group");
    ids.events = event.id;
    ids.groups = group.id;
  }, 60_000);

  afterAll(async () => {
    for (const { table, bucket } of kinds) {
      const { data: left } = await admin.storage.from(bucket).list(ids[table]);
      if (left?.length) await admin.storage.from(bucket).remove(left.map((file) => `${ids[table]}/${file.name}`));
      await admin.from(table).delete().eq("id", ids[table]);
    }
  });

  it("are set by a manager: the file, then its path on the row, as the app does", async () => {
    for (const { table, bucket } of kinds) {
      const { error: uploadError } = await alice.client.storage.from(bucket).upload(pathFor(table), jpeg(), { contentType: "image/jpeg" });
      const { data: updated } = await alice.client.from(table).update({ thumbnail_path: pathFor(table) }).eq("id", ids[table]).select("id");

      expect(uploadError).toBeNull();
      expect(updated).toHaveLength(1);
    }
  });

  it("cannot be set, replaced or erased by a member, or by someone still waiting", async () => {
    for (const { table, bucket } of kinds) {
      for (const user of [bob, carol]) {
        const files = user.client.storage.from(bucket);
        const { error: uploadError } = await files.upload(pathFor(table, `by-${user.id}`), jpeg(), { contentType: "image/jpeg" });
        await user.client.from(table).update({ thumbnail_path: "defaced.jpg" }).eq("id", ids[table]);
        await user.client.from(table).update({ thumbnail_path: null }).eq("id", ids[table]);
        await files.remove([pathFor(table)]);

        expect(uploadError).not.toBeNull();
      }
      const { data: files } = await admin.storage.from(bucket).list(ids[table]);

      expect(await storedPath(table)).toBe(pathFor(table));
      expect(files?.map((file) => file.name)).toEqual(["picture.jpg"]); // still there, and nothing was added
    }
  });

  it("refuse a file that is not a JPEG, or is over 200 KB, even from a manager", async () => {
    for (const { table, bucket } of kinds) {
      const files = alice.client.storage.from(bucket);
      const { error: notAPicture } = await files.upload(pathFor(table, "script"), new Blob(["<script>"], { type: "text/html" }), { contentType: "text/html" });
      const { error: tooBig } = await files.upload(pathFor(table, "big"), new Blob([new Uint8Array(250_000)], { type: "image/jpeg" }), { contentType: "image/jpeg" });

      expect(notAPicture).not.toBeNull();
      expect(tooBig).not.toBeNull();
    }
  });

  it("are public on purpose: the file opens by its address alone, but nobody can list the bucket", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    for (const { table, bucket } of kinds) {
      const picture = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathFor(table)}`);
      const { data: listedSignedOut } = await anonymous.storage.from(bucket).list(ids[table]);
      const { data: listedByMember } = await bob.client.storage.from(bucket).list(ids[table]);

      expect(picture.status).toBe(200);
      expect(listedSignedOut ?? []).toEqual([]);
      expect(listedByMember ?? []).toEqual([]);
    }
  });

  it("reach members through the page's one read", async () => {
    const everything = { until: "2999-01-01T00:00:00Z", cancelled_since: "1970-01-01T00:00:00Z" };
    const { data: schedule } = await bob.client.rpc("upcoming_events", everything);
    const { data: directory } = await bob.client.rpc("group_directory");
    const { data: groupList } = await bob.client.rpc("my_groups");
    const find = (rows: { id: string; thumbnail_path: string | null }[] | null, id: string) => rows?.find((row) => row.id === id);

    expect(find(schedule, ids.events)?.thumbnail_path).toBe(pathFor("events"));
    expect(find(directory, ids.groups)?.thumbnail_path).toBe(pathFor("groups"));
    expect(find(groupList, ids.groups)?.thumbnail_path).toBe(pathFor("groups"));
  });

  it("are removed by a manager: off the row, then the file", async () => {
    for (const { table, bucket } of kinds) {
      const { data: cleared } = await alice.client.from(table).update({ thumbnail_path: null }).eq("id", ids[table]).select("id");
      const { data: erased } = await alice.client.storage.from(bucket).remove([pathFor(table)]);

      expect(cleared).toHaveLength(1);
      expect(erased).toHaveLength(1);
      expect(await storedPath(table)).toBeNull();
    }
  });
});

describe("approval: an account nobody has let in yet", () => {
  // Carol signed up and was never approved. Alice holds the admin role by now; Bob is a plain member.
  // Runs last: it ends with Carol being let in.
  const everything = { until: "2999-01-01T00:00:00Z", cancelled_since: "1970-01-01T00:00:00Z" };

  it("reads nothing of the church, even by asking Supabase directly", async () => {
    const [groups, memberships, messages, events, texts, schedule, feed, groupList] = await Promise.all([
      carol.client.from("groups").select("id"),
      carol.client.from("group_members").select("group_id"),
      carol.client.from("messages").select("id"),
      carol.client.from("events").select("id"),
      carol.client.from("event_texts").select("event_id"),
      carol.client.rpc("upcoming_events", everything),
      carol.client.from("prayer_feed").select("id"),
      carol.client.rpc("my_groups"),
    ]);

    for (const read of [groups, memberships, messages, events, texts, schedule, feed, groupList]) {
      expect(read.data ?? []).toEqual([]);
    }
    // The same reads are not empty for a member, so "nothing" above is the door and not an empty database.
    expect((await bob.client.from("groups").select("id")).data?.length).toBeGreaterThan(0);
  });

  it("writes nothing either", async () => {
    const { error: asksToJoin } = await carol.client.from("group_join_requests").insert({ group_id: groupId });
    const { error: postsMessage } = await carol.client.from("messages").insert({ group_id: groupId, body: "hello" });

    expect(asksToJoin).not.toBeNull();
    expect(postsMessage).not.toBeNull();
  });

  it("still has what waiting needs: its own name and language", async () => {
    const { data: outcome } = await carol.client.rpc("set_my_name", { new_name: "Carol" });
    const { data: profile } = await carol.client.from("profiles").select("name").eq("user_id", carol.id).single();
    const { error: languageError } = await carol.client.from("user_settings").upsert({ language: "en" }, { onConflict: "user_id" });

    expect(outcome).toBe("saved");
    expect(profile?.name).toBe("Carol");
    expect(languageError).toBeNull();
  });

  it("is listed, with its email, for someone with accounts.manage and for nobody else", async () => {
    const { data: forAdmin } = await alice.client.rpc("waiting_accounts");
    const { data: forMember } = await bob.client.rpc("waiting_accounts");
    const { data: forHerself } = await carol.client.rpc("waiting_accounts");
    const listed = forAdmin?.find((account: { user_id: string }) => account.user_id === carol.id);

    expect(listed).toMatchObject({ name: "Carol", email: carol.email });
    expect(forAdmin?.map((account: { user_id: string }) => account.user_id)).not.toContain(bob.id); // already in
    expect(forMember).toEqual([]);
    expect(forHerself).toEqual([]);
  });

  it("cannot let itself in, and a member cannot let it in", async () => {
    const { data: byHerself } = await carol.client.rpc("approve_account", { user_id: carol.id });
    const { data: byMember } = await bob.client.rpc("approve_account", { user_id: carol.id });
    const { error: byHand } = await carol.client.from("user_roles").insert({ user_id: carol.id, role: "member" });

    expect([byHerself, byMember]).toEqual([false, false]);
    expect(byHand).not.toBeNull();
  });

  it("is let in by an admin, once, and then reads the church without signing in again", async () => {
    const { data: first } = await alice.client.rpc("approve_account", { user_id: carol.id });
    const { data: second } = await alice.client.rpc("approve_account", { user_id: carol.id });
    await carol.client.auth.refreshSession(); // what the waiting screen does on every return to the app

    const { data: groups } = await carol.client.from("groups").select("id");
    const { data: stillWaiting } = await alice.client.rpc("waiting_accounts");

    expect([first, second]).toEqual([true, false]); // false is what stops the server telling her twice
    expect(groups?.length).toBeGreaterThan(0);
    expect(stillWaiting?.map((account: { user_id: string }) => account.user_id)).not.toContain(carol.id);
  });
});

describe("staff: the staff page's headings, people and placements (staff/schema.sql)", () => {
  // The page's own read (server/queries.ts), with placements and people embedded.
  const read = (client: SupabaseClient) =>
    client.from("staff_sections").select("id, staff_placements (staff_people (id))");

  it("are read by an approved member, and by nobody waiting or signed out", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: forMember } = await read(bob.client);
    const { data: forWaiting } = await read(carol.client);
    const { data: signedOut } = await read(anonymous);

    expect(forMember?.length).toBeGreaterThan(0); // the seed in schema.sql
    expect(forMember?.some((section) => section.staff_placements.length > 0)).toBe(true);
    expect(forWaiting ?? []).toEqual([]);
    expect(signedOut ?? []).toEqual([]);
  });

  it("cannot be written by a member: the user edits them in the SQL Editor", async () => {
    const { data: section } = await admin.from("staff_sections").select("id").limit(1).single();
    const { error: newHeading } = await bob.client.from("staff_sections").insert({ heading_en: "x", heading_vi: "x" });
    const { error: newPerson } = await bob.client
      .from("staff_people")
      .insert({ name_en: "x", name_vi: `x-${Date.now()}`, role_en: "x", role_vi: "x" });
    const { data: changed } = await bob.client.from("staff_people").update({ phone: "000" }).not("id", "is", null).select("id");
    const { data: moved } = await bob.client.from("staff_placements").delete().eq("section_id", section?.id).select();

    expect(newHeading).not.toBeNull();
    expect(newPerson).not.toBeNull();
    expect(changed ?? []).toEqual([]);
    expect(moved ?? []).toEqual([]);
  });
});

describe("weekly_card: the Events tab's first card (events/schema.sql 3h)", () => {
  const read = (client: SupabaseClient) => client.from("weekly_card").select("title, title_en, address, contact_phone");

  it("is read by an approved member, and by nobody waiting or signed out", async () => {
    const anonymous = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: forMember } = await read(bob.client);
    const { data: forWaiting } = await read(carol.client);
    const { data: signedOut } = await read(anonymous);

    expect(forMember).toHaveLength(1); // the seed in schema.sql
    expect(forWaiting ?? []).toEqual([]);
    expect(signedOut ?? []).toEqual([]);
  });

  it("is changed by an event manager only, and never gets a second row", async () => {
    const { data: before } = await read(admin).single();
    const { data: byMember } = await bob.client.from("weekly_card").update({ title: "x" }).eq("id", true).select("id");
    const { data: byManager } = await alice.client // an admin since the "permissions" tests
      .from("weekly_card")
      .update({ title: before?.title })
      .eq("id", true)
      .select("id");
    const { error: secondRow } = await alice.client.from("weekly_card").insert({ id: false, title: "x" });

    expect(byMember ?? []).toEqual([]);
    expect(byManager).toHaveLength(1);
    expect(secondRow).not.toBeNull();
  });
});

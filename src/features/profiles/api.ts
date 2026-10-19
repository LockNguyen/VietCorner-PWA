import { createClient } from "@/lib/supabase/client";
import { AVATAR_BUCKET, type NameOutcome, type NameRequest, type Names } from "./types";

// Every browser → backend call for this foundation.
// - Setting a name and approving one go through our API routes, because each notifies someone (needs secrets).
// - Declining a request, reading names and my picture go straight to Supabase; RLS in schema.sql decides what is allowed.

// POST my name. Answers whether it was saved at once or is now waiting for a manager.
export async function saveName(name: string): Promise<NameOutcome> {
  const response = await post("/api/names/request", { name });
  return (await response.json()).outcome;
}

// POST an approval: the requested name becomes that person's name, and they are told.
export async function approveNameRequest(userId: string): Promise<void> {
  await post("/api/names/approve", { userId });
}

// DELETE a request for a name. Nobody is told; the person keeps their name and may ask again.
export async function declineNameRequest(userId: string): Promise<void> {
  const { error } = await createClient().from("name_requests").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// GET everyone waiting for a name to be approved, as the Admin page first read it (server/queries.ts).
// For the list to refresh itself on arrival.
export async function getNameRequests(): Promise<NameRequest[]> {
  const { data, error } = await createClient()
    .from("name_requests")
    .select("user_id, user_email, name, requested_at")
    .order("requested_at");
  if (error) throw new Error(error.message);
  return data;
}

// GET the names of these people: for someone who appears on a screen after it loaded (a first chat message).
// The same read as server/queries.ts makes for the page, here with the browser's client.
export async function getNames(userIds: string[]): Promise<Names> {
  const { data } = await createClient().from("profiles").select("user_id, name").in("user_id", userIds);
  return Object.fromEntries((data ?? []).map((row) => [row.user_id, row.name]));
}

// PUT my picture (already cropped and small): a new file in my own folder, my profile pointed at it, then
// the picture it replaces erased.
export async function setAvatar(userId: string, picture: Blob, replaces: string | null): Promise<void> {
  const supabase = createClient();
  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await bucket.upload(path, picture, { contentType: "image/jpeg" });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.rpc("set_my_avatar", { path });
  if (error) throw new Error(error.message);

  if (replaces) await bucket.remove([replaces]); // best-effort: a file left behind is on no screen
}

// DELETE my picture: my profile goes back to the default figure, then the file is erased.
export async function removeAvatar(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_my_avatar", { path: null });
  if (error) throw new Error(error.message);

  await supabase.storage.from(AVATAR_BUCKET).remove([path]); // best-effort, as above
}

async function post(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.json()).error);
  return response;
}

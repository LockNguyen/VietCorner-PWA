import { createClient } from "@/lib/supabase/client";
import type { NameOutcome, NameRequest, Names } from "./types";

// Every browser → backend call for this foundation.
// - Setting a name and approving one go through our API routes, because each notifies someone (needs secrets).
// - Declining a request and reading names go straight to Supabase; RLS in schema.sql decides what is allowed.

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

async function post(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.json()).error);
  return response;
}

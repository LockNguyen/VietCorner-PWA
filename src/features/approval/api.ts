import { createClient } from "@/lib/supabase/client";
import type { WaitingAccount } from "./types";

// Every browser → backend call for this feature.
// - Asking to be let in and approving go through our API routes, because each notifies someone (needs secrets).
// - Reading who is waiting goes straight to Supabase; the function in schema.sql decides what comes back.

// POST "I am waiting": tells the admins, once per account however often it is called.
export async function askToBeLetIn(): Promise<void> {
  await post("/api/approval/request", {});
}

// POST an approval: that account may use the app from now on, and the person is told.
export async function approveAccount(userId: string): Promise<void> {
  await post("/api/approval/approve", { userId });
}

// GET everyone waiting, as the Admin page first read it (server/queries.ts). For the list to refresh itself.
export async function getWaitingAccounts(): Promise<WaitingAccount[]> {
  const { data, error } = await createClient().rpc("waiting_accounts");
  if (error) throw new Error(error.message);
  return data;
}

// Trades my login token for a new one. An approval reaches a token only when it is next issued (up to an
// hour later by itself), so the waiting screen asks for a new one instead of asking the person to sign in again.
export async function renewMyToken(): Promise<void> {
  const { error } = await createClient().auth.refreshSession();
  if (error) throw error;
}

async function post(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.json()).error);
}

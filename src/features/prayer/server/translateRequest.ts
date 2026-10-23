import "server-only";
import { callAiService } from "@/lib/aiService";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyReviewers } from "./notifyReviewers";

// Finds a request's language and translates it into the other one (the AI service's POST /translate), then tells
// the reviewers. Runs after the author's post or edit has been answered (the routes' `after`), so the author never
// waits for it. Readers see the translation only once a reviewer approves it (schema.sql 5d).
// Only the text is sent, never who wrote it (the user, 2026-10-22).
// Uses the admin client because members have no grant on the translation columns, by design.
export async function translateRequest(requestId: string) {
  const admin = createAdminClient();
  const { data: request } = await admin.from("prayer_requests").select("body").eq("id", requestId).single();
  if (!request) return; // deleted before we got to it

  try {
    const { language, translation } = await callAiService("/translate", JSON.stringify({ text: request.body }), {
      "Content-Type": "application/json",
    });
    // Only for the words that were translated: if the author edited them meanwhile, that edit's own translation
    // is on its way, and this one belongs to text that no longer exists.
    await admin.from("prayer_requests").update({ language, translation }).eq("id", requestId).eq("body", request.body);
  } catch (error) {
    // Busy, offline or unreadable: the translation stays empty, and the request waits on the review list for a
    // reviewer to write one (Edit). Logged without the text, which is private.
    console.error("translateRequest failed", requestId, (error as Error).message);
  }

  await notifyReviewers();
}

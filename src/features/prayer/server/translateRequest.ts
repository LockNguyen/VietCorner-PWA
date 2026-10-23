import "server-only";
import { AiServiceUnavailable, callAiService } from "@/lib/aiService";
import { createAdminClient } from "@/lib/supabase/admin";

// What became of one translation: written; not now, because the AI service is busy or unreachable (temporary, try
// again later); or failed, which is our own error (a refused save, a wrong token or address), logged for whoever
// fixes it. The reviewer's Retry tells the two apart (the user, 2026-10-23: "tell me it's busy").
export type TranslationResult = "translated" | "busy" | "failed";

// Finds a request's language and translates it into the other one (the AI service's POST /translate), and answers
// what became of it. Readers see it only once a reviewer approves it (schema.sql 5d).
// Only the text is sent, never who wrote it (the user, 2026-10-22). Nothing here logs the text: it is private.
// Uses the admin client because members have no grant on the translation columns, by design.
export async function translateRequest(requestId: string): Promise<TranslationResult> {
  const admin = createAdminClient();
  const { data: request } = await admin.from("prayer_requests").select("body").eq("id", requestId).single();
  if (!request) return "failed"; // deleted before we got to it

  let answer: { language: string; translation: string };
  try {
    answer = await callAiService("/translate", JSON.stringify({ text: request.body }), {
      "Content-Type": "application/json",
    });
  } catch (error) {
    // Either way the translation stays as it was (none for a new request), and the request waits on the review list
    // for a reviewer to write one (the pencil) or try again.
    console.error("translateRequest: no translation", requestId, (error as Error).message);
    return error instanceof AiServiceUnavailable ? "busy" : "failed";
  }

  const { data: written, error } = await admin
    .from("prayer_requests")
    .update({ language: answer.language, translation: answer.translation })
    .eq("id", requestId)
    // Only onto the words that were translated: if the author edited them meanwhile, that edit's own translation is
    // on its way. And only while unreviewed: an approved translation is replaced only after a reviewer reopens it
    // (Retry), never by a resent edit of the same words, which clears nothing.
    .eq("body", request.body)
    .is("translation_reviewed_at", null)
    .select("id");
  if (error) console.error("translateRequest: not saved", requestId, error.message); // e.g. longer than the column allows
  return (written ?? []).length > 0 ? "translated" : "failed";
}

import { NextResponse } from "next/server";
import { AiServiceUnavailable } from "@/features/assistant/server/aiService";
import { askQuestion } from "@/features/assistant/server/askQuestion";
import type { Turn } from "@/features/assistant/types";
import { createClient } from "@/lib/supabase/server";

// POST { question, history } → the answer with its sources.
// The route exists because the AI service's address and token are secrets: the browser never sees them.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // A body that isn't JSON is a bad request, not a server fault, so parse before trusting it.
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });

  // History is optional and only ever used to rewrite a follow-up. Anything malformed is dropped rather
  // than rejected: a bad history costs a worse rewrite, not an answer.
  const history: Turn[] = Array.isArray(body?.history)
    ? body.history.filter(
        (turn: Turn) =>
          (turn?.role === "user" || turn?.role === "assistant") && typeof turn?.text === "string",
      )
    : [];

  try {
    return NextResponse.json(await askQuestion(question, history));
  } catch (error) {
    if (error instanceof AiServiceUnavailable) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("assistant ask failed", error);
    return NextResponse.json({ error: "The assistant failed. Please try again." }, { status: 500 });
  }
}

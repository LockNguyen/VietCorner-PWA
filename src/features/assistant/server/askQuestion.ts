import "server-only";

import type { Answer, Turn } from "../types";
import { callAiService } from "./aiService";

// Ask the AI service a question, with the recent turns so it can resolve a follow-up ("what about the
// other group?") before searching. The service does the whole pipeline: rewrite → embed → search → answer.
export async function askQuestion(question: string, history: Turn[]): Promise<Answer> {
  return callAiService("/ask", JSON.stringify({ question, history }), {
    "Content-Type": "application/json",
  });
}

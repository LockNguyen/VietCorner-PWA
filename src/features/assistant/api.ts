import { AssistantError, causeForStatus } from "./errors";
import type { Answer, Recording, Turn } from "./types";

// Assistant API: every call the browser makes for this feature lives in this file.
// Both go through our own API routes, never straight to the AI service: its address and token are secrets,
// and a browser cannot keep a secret. The routes check the login, then forward the call.
//
// Every failure leaves here as an AssistantError with a cause, so no other file has to know about
// HTTP statuses, `fetch` rejections or abort errors.

// why: the routes give up at 9 s (Netlify's limit is ~10 s). A little more, and the user sees our own
// "took too long" message instead of a request that hangs forever on a flaky phone connection.
const TIMEOUT_MS = 12_000;

async function post(path: string, body: BodyInit, headers: HeadersInit = {}) {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (failure) {
    // fetch rejects for two reasons only: we aborted it, or the network never reached the server.
    throw new AssistantError((failure as Error).name === "TimeoutError" ? "timeout" : "offline");
  }

  if (!response.ok) throw new AssistantError(causeForStatus(response.status));
  return response.json();
}

// POST a question plus the recent turns, get the answer with its sources.
export async function askQuestion(question: string, history: Turn[]): Promise<Answer> {
  return post("/api/assistant/ask", JSON.stringify({ question, history }), {
    "Content-Type": "application/json",
  });
}

// POST a recording, get back what the user said. "" means nothing was understood.
export async function transcribeRecording(recording: Recording): Promise<string> {
  const form = new FormData();
  form.append("audio", recording.blob, recording.filename);

  const { text } = await post("/api/assistant/transcribe", form);
  return text;
}

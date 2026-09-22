import "server-only";

// The only place that knows where the AI service lives and what its token is. Both are secrets: they have
// no NEXT_PUBLIC_ prefix, so Next.js never ships them to the browser. This file imports nothing from
// Next.js, so it could move to another backend unchanged.

const SERVICE_URL = process.env.AI_SERVICE_URL;
const SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN;

// why: Netlify stops a function at ~10 s. Giving up at 9 s turns a timeout into our own clear error
// instead of the host's generic one. The AI service has a shorter budget of its own (7 s for the LLM).
const TIMEOUT_MS = 9_000;

// Raised when the service is unreachable or busy: the routes turn it into 503 "try again".
export class AiServiceUnavailable extends Error {}

// POST to the AI service and return its JSON.
export async function callAiService(path: string, body: BodyInit, headers: HeadersInit = {}) {
  if (!SERVICE_URL || !SERVICE_TOKEN) {
    throw new Error("AI_SERVICE_URL and AI_SERVICE_TOKEN are missing from the environment");
  }

  let response: Response;
  try {
    response = await fetch(`${SERVICE_URL}${path}`, {
      method: "POST",
      headers: { ...headers, Authorization: `Bearer ${SERVICE_TOKEN}` },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // The machine running the service is off or asleep, or the tunnel is down.
    throw new AiServiceUnavailable("The assistant is offline. Please try again later.");
  }

  if (response.status === 503) {
    const { detail } = await response.json().catch(() => ({ detail: "" }));
    throw new AiServiceUnavailable(detail || "The assistant is busy. Please try again in a minute.");
  }
  if (!response.ok) {
    // 401 means our token is wrong; 4xx means we sent something invalid. Either way it is our bug.
    throw new Error(`AI service ${path} failed with ${response.status}`);
  }
  return response.json();
}

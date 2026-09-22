// Shapes used by the assistant. The ones that cross the wire keep the AI service's own spelling
// (`page_number`), so nothing has to be renamed on the way through.

// One passage an answer was built from. Shown as "trang 12" so a user can check the answer themselves.
export type Source = {
  document: string;
  page_number: number;
  similarity: number;
};

// What /api/assistant/ask returns.
export type Answer = {
  text: string;
  provider: string;
  sources: Source[];
};

// One earlier message, sent with a follow-up so the service can rewrite it into a standalone question.
// Sources are left out on purpose: they cost tokens and never explain what "it" referred to.
export type Turn = {
  role: "user" | "assistant";
  text: string;
};

// A finished recording. The file name carries the format, which is how Whisper knows how to decode it.
export type Recording = {
  blob: Blob;
  filename: string;
};

// Why a message fails. The cause, not the HTTP status, is what the UI reacts to: the two most common
// failures (no network, timed out) have no status at all. See errors.ts.
export type ErrorCause = "offline" | "timeout" | "unauthorized" | "invalid" | "busy" | "server";

// One bubble in the conversation, exactly as it is stored on the device.
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[]; // answers only
  status: "sending" | "done" | "error";
  errorCause?: ErrorCause; // set when status is "error"
  askedByVoice?: boolean; // user messages only: decides whether the answer is read aloud
};

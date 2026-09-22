import "server-only";

import { callAiService } from "./aiService";

// Turn a recording into text (Whisper, on the AI service). Returns "" when nothing was understood.
// The file keeps its name, because its extension tells the speech API which format to decode.
export async function transcribeAudio(audio: File): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, audio.name);

  const { text } = await callAiService("/transcribe", form);
  return text;
}

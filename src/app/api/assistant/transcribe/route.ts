import { NextResponse } from "next/server";
import { AiServiceUnavailable } from "@/features/assistant/server/aiService";
import { transcribeAudio } from "@/features/assistant/server/transcribeAudio";
import { createClient } from "@/lib/supabase/server";

// POST a recording (form field "audio") → { text }, what the user said.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // A body that isn't a form (or is empty) must answer 400, not crash with 500.
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "audio is required" }, { status: 400 });
  }

  try {
    return NextResponse.json({ text: await transcribeAudio(audio) });
  } catch (error) {
    if (error instanceof AiServiceUnavailable) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("assistant transcribe failed", error);
    return NextResponse.json({ error: "Could not understand the recording. Please try again." }, { status: 500 });
  }
}

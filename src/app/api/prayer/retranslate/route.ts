import { NextResponse } from "next/server";
import { retranslateRequest } from "@/features/prayer/server/retranslateRequest";
import { isId } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

// POST { requestId } → a reviewer's Retry: translates the request again and answers once the AI service has: 204, or
// 503 when the AI service is busy or unreachable (try again later), 500 for our own error, 403 for a non-reviewer.
// Not after the answer, as posting is: the reviewer is waiting for the new translation, to read it.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { requestId } = await request.json();
  if (!isId(requestId)) return NextResponse.json({ error: "requestId is required" }, { status: 400 });

  try {
    const result = await retranslateRequest(supabase, requestId);
    if (result === "refused") return NextResponse.json({ error: "Not allowed, or no such request" }, { status: 403 });
    if (result === "busy") return NextResponse.json({ error: "The translation service is busy or offline" }, { status: 503 });
    if (result === "failed") return NextResponse.json({ error: "The translation could not be made or saved" }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

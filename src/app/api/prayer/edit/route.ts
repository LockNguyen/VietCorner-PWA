import { after, NextResponse } from "next/server";
import { editRequest } from "@/features/prayer/server/editRequest";
import { translateRequest } from "@/features/prayer/server/translateRequest";
import { createClient } from "@/lib/supabase/server";

// POST { requestId, body } → changes the words of my own request, then translates them again once I have my answer.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { requestId, body } = await request.json();
  if (typeof requestId !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "requestId and body are required" }, { status: 400 });
  }

  try {
    // Not mine, or gone: nothing changed, so there is nothing to translate (the same quiet answer RLS gives).
    if (await editRequest(supabase, requestId, body)) after(() => translateRequest(requestId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

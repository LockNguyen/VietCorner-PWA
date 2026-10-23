import { after, NextResponse } from "next/server";
import { postRequest } from "@/features/prayer/server/postRequest";
import { translateRequest } from "@/features/prayer/server/translateRequest";
import { createClient } from "@/lib/supabase/server";

// POST { body } → posts a request to the whole church, then translates it once the author has their answer.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { body } = await request.json();
  if (typeof body !== "string") return NextResponse.json({ error: "body is required" }, { status: 400 });

  try {
    const requestId = await postRequest(supabase, body);
    // After the response: the author sees their request at once, and the translation never delays it.
    after(() => translateRequest(requestId));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prayFor } from "@/features/prayer/server/prayFor";
import { createClient } from "@/lib/supabase/server";

// POST { requestId } → counts one prayer for that request and notifies its author.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { requestId } = await request.json();
  if (typeof requestId !== "string") {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  try {
    await prayFor(supabase, requestId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { approveNameRequest } from "@/features/profiles/server/nameRequests";
import { createClient } from "@/lib/supabase/server";

// POST { userId } → makes that person's requested name their name, and tells them.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { userId } = await request.json();
  if (typeof userId !== "string") return NextResponse.json({ error: "userId is required" }, { status: 400 });

  try {
    await approveNameRequest(supabase, userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // The database function refused: no such request, or the caller may not manage groups.
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

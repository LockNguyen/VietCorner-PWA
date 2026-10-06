import { NextResponse } from "next/server";
import { requestToJoin } from "@/features/groups/server/joinRequests";
import { createClient } from "@/lib/supabase/server";

// POST { groupId } → asks to join that group and tells the managers.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { groupId } = await request.json();
  if (typeof groupId !== "string") {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  try {
    await requestToJoin(supabase, groupId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // RLS or the database function refused: a removed group, or already asked.
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

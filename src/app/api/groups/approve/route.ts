import { NextResponse } from "next/server";
import { approveJoinRequest } from "@/features/groups/server/joinRequests";
import { createClient } from "@/lib/supabase/server";

// POST { groupId, userId } → makes that person a member and tells them.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { groupId, userId } = await request.json();
  if (typeof groupId !== "string" || typeof userId !== "string") {
    return NextResponse.json({ error: "groupId and userId are required" }, { status: 400 });
  }

  try {
    await approveJoinRequest(supabase, groupId, userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // RLS or the database function refused: no such request, or the caller may not manage groups.
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

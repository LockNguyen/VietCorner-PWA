import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/features/chat/server/sendMessage";

// POST { groupId, body } → saves the message and pushes it to the group's other members.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { groupId, body } = await request.json();
  if (typeof groupId !== "string" || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "groupId and body are required" }, { status: 400 });
  }

  try {
    const message = await sendMessage(supabase, { groupId, body: body.trim() });
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    // Most likely RLS: the user is not a member of this group.
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

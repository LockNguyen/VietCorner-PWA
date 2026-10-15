import { NextResponse } from "next/server";
import { notifyAdminsOfArrival } from "@/features/approval/server/notifyApproval";
import { createClient } from "@/lib/supabase/server";

// POST → tells the admins that the signed-in account is waiting to be let in. Takes no input: who is asking
// comes from the session, so nobody can announce someone else. Safe to call again: admins are told once.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await notifyAdminsOfArrival(user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

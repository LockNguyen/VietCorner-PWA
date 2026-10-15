import { NextResponse } from "next/server";
import { approveAccount } from "@/features/approval/server/approveAccount";
import { createClient } from "@/lib/supabase/server";

// POST { userId } → lets that account use the app, and tells the person.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { userId } = await request.json();
  if (typeof userId !== "string") return NextResponse.json({ error: "userId is required" }, { status: 400 });

  try {
    await approveAccount(supabase, userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // The database function refused: already approved, or the caller may not approve accounts.
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

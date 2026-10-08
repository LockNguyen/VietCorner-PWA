import { NextResponse } from "next/server";
import { setMyName } from "@/features/profiles/server/nameRequests";
import { MAX_NAME_LENGTH } from "@/features/profiles/types";
import { createClient } from "@/lib/supabase/server";

// POST { name } → { outcome: "saved" | "requested" }. Saved at once for someone in no group; otherwise
// kept for a manager to approve, and the managers are told.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { name } = await request.json();
  if (typeof name !== "string" || name.trim() === "" || name.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `name is required, at most ${MAX_NAME_LENGTH} characters` }, { status: 400 });
  }

  try {
    return NextResponse.json({ outcome: await setMyName(supabase, name.trim()) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

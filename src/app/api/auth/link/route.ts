import { NextResponse } from "next/server";
import { isHex64 } from "@/features/auth/handoff";
import { sendSignInLink } from "@/features/auth/server/sendLink";

// POST { email, attempt, name? } → emails a sign-in link (with a name: a new account's) → 204.
// A failure answers with Supabase's own status and `code`, which the browser turns into words (errors.ts).
//
// No signed-in user to verify: the caller is signing in. What it can do is what Supabase lets anyone do
// with the public key, ask for a link to an address; the link's key it never sees. Rate limits are
// Supabase's (one link per address per minute); ours are backlog B3.
export async function POST(request: Request) {
  const { email, attempt, name } = await request.json();
  const origin = request.headers.get("origin"); // the app's own address: links lead back to where they were asked
  if (typeof email !== "string" || email.trim().length < 3 || email.length > 320 || !isHex64(attempt) || !origin) {
    return NextResponse.json({ error: "email and attempt are required", code: "validation_failed" }, { status: 400 });
  }
  if (name !== undefined && (typeof name !== "string" || name.trim() === "" || name.length > 60)) {
    return NextResponse.json({ error: "name must be 1 to 60 characters", code: "validation_failed" }, { status: 400 });
  }

  try {
    await sendSignInLink({ email: email.trim(), attempt, name: name?.trim(), origin });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { message, status, code } = error as { message: string; status?: number; code?: string };
    return NextResponse.json({ error: message, code }, { status: status ?? 500 });
  }
}

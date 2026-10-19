import { NextResponse } from "next/server";
import { isHex64 } from "@/features/auth/handoff";
import { leaveSignIn } from "@/features/auth/server/handoff";

// POST { attempt, linkKey } → marks an email link as tapped, for the device that asked to sign in → 204,
// or 410 when the link is not one of today's (too old, already used, or made up).
//
// No signed-in user to verify: the caller is someone who is not signed in yet. The link's key is the proof
// that they read the email; only the device holding the attempt's secret can then collect. Only ever called
// from a button tap, never by opening the link, so a mail scanner that fetches links confirms nothing.
export async function POST(request: Request) {
  const { attempt, linkKey } = await request.json();
  if (!isHex64(attempt) || !isHex64(linkKey)) {
    return NextResponse.json({ error: "attempt and linkKey are required" }, { status: 400 });
  }

  try {
    if (!(await leaveSignIn(attempt, linkKey))) return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { isHex64 } from "@/features/auth/handoff";
import { collectSignIn } from "@/features/auth/server/handoff";

// POST { claimKey } → { tokenHash } — a one-time token for the device holding this secret key, once one of
// its links has been tapped; null until then. Answers once: collecting spends the day's links.
//
// No signed-in user to verify: the caller is signing in. The key is the proof: 32 random bytes that never
// left the device that asked, so guessing someone else's is not possible.
export async function POST(request: Request) {
  const { claimKey } = await request.json();
  if (!isHex64(claimKey)) return NextResponse.json({ error: "claimKey is required" }, { status: 400 });

  try {
    return NextResponse.json({ tokenHash: await collectSignIn(claimKey) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

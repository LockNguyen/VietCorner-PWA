import { NextResponse } from "next/server";
import { isHex64 } from "@/features/auth/handoff";
import { leaveSignIn } from "@/features/auth/server/handoff";

const TOKEN_HASH = /^[A-Za-z0-9_-]{1,200}$/;

// POST { attempt, tokenHash } → leaves an email link's token for the device that asked to sign in.
//
// No signed-in user to verify: the caller is someone who is not signed in yet. What it can do is narrow:
// store one short value under a key of a fixed shape, which only the device holding that key's secret can
// collect. Only ever called from a button tap, never by opening the link, so a mail scanner that fetches
// links cannot confirm a sign-in for anyone.
export async function POST(request: Request) {
  const { attempt, tokenHash } = await request.json();
  if (!isHex64(attempt) || typeof tokenHash !== "string" || !TOKEN_HASH.test(tokenHash)) {
    return NextResponse.json({ error: "attempt and tokenHash are required" }, { status: 400 });
  }

  try {
    await leaveSignIn(attempt, tokenHash);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

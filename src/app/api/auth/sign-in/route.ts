import { NextResponse } from "next/server";
import { signInWithPassword } from "@/features/auth/server/signIn";
import { createClient } from "@/lib/supabase/server";

// POST, from the sign-in screen's plain HTML form (email, password) → 303 to Home, signed in, or back to
// `/login?problem=<cause>`. A real form post on purpose, not fetch: it is what makes the phone offer
// "Save password?" (the auth README, "Saving the password").
// No signed-in user to verify: this is how one signs in, and Supabase checks the password.
export async function POST(request: Request) {
  // A form on another website must not sign this browser in (to the attacker's account, unnoticed).
  if (request.headers.get("sec-fetch-site") === "cross-site") return new NextResponse(null, { status: 403 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return goTo("/login?problem=other");

  const problem = await signInWithPassword(await createClient(), email, password);
  return goTo(problem ? `/login?problem=${problem}` : "/");
}

// A relative address: behind a tunnel this server does not know the address the phone used.
function goTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

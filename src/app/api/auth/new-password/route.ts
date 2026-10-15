import { NextResponse } from "next/server";
import { setNewPassword } from "@/features/auth/server/signIn";
import { createClient } from "@/lib/supabase/server";

// POST, from the new-password screen's plain HTML form (password) → 303 to Home, or back to
// `/settings/password?problem=<cause>`. A real form post for the same reason as sign-in: the phone then
// offers to save the new password (the auth README, "Saving the password").
export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return new NextResponse(null, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return goTo("/login");

  const password = String((await request.formData()).get("password") ?? "");
  if (!password) return goTo("/settings/password?problem=weakPassword");

  const problem = await setNewPassword(supabase, password);
  return goTo(problem ? `/settings/password?problem=${problem}` : "/");
}

// A relative address: behind a tunnel this server does not know the address the phone used.
function goTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

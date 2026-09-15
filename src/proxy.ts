// Next.js runs this before matching requests. Only used by the auth feature.
// To remove login: delete this file (and src/features/auth, src/app/login).
import type { NextRequest } from "next/server";
import { refreshSession } from "@/features/auth/refreshSession";

export function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  // Skip static files so the app can install and the service worker loads even when logged out.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)"],
};

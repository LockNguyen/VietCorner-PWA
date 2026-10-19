// Next.js runs this before matching requests. Only used by the auth feature.
// To remove login: delete this file (and src/features/auth, src/app/login).
import type { NextRequest } from "next/server";
import { refreshSession } from "@/features/auth/server/refreshSession";

export function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  // Skip static files so the app can install and the service worker loads even when logged out, and so
  // the app's own pictures (public/images) do not each wait on a login check. `launch/`: iOS fetches the
  // launch pictures before anyone signs in, and a redirect to /login would leave the screen black.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|images/|launch/).*)"],
};

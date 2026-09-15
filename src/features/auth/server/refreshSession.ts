import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/login";
const HOME_PATH = "/groups";

// Called by src/proxy.ts before every request.
// 1) Refreshes the login cookie so users stay signed in.
// 2) Sends logged-out users to /login, and logged-in users away from it.
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          // Copy refreshed cookies onto both the request (for this render) and the response (for the browser).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Validates the token and refreshes it if expired. Keep this directly after createServerClient.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const isOnLoginPage = request.nextUrl.pathname.startsWith(LOGIN_PATH);
  // API routes answer 401 themselves. A redirect would hand fetch() an HTML page instead of JSON.
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (!isLoggedIn && !isOnLoginPage && !isApi) return redirectTo(request, LOGIN_PATH);
  if (isLoggedIn && isOnLoginPage) return redirectTo(request, HOME_PATH);
  return response;
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

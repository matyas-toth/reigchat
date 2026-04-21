import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // We can loosely check for the session cookie. better-auth typically sets a better-auth.session_token
  // or __Secure-better-auth.session_token on HTTPS.
  const hasSessionCookie = 
    request.cookies.has("better-auth.session_token") || 
    request.cookies.has("__Secure-better-auth.session_token");

  const { pathname } = request.nextUrl;

  if (hasSessionCookie && ["/", "/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register"]
};

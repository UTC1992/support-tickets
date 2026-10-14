import { NextResponse, type NextRequest } from "next/server";
import createSupabaseProxyClient from "@/lib/auth/supabase-proxy";

const publicPaths = ["/login", "/auth/callback", "/auth/confirm", "/set-password"];
const protectedPathPrefixes = ["/admin", "/technician", "/tickets", "/dashboard"];

const redirectWithCookies = (destination: URL, response: NextResponse) => {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
};

const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const { supabase, getResponse } = createSupabaseProxyClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    user?.user_metadata.must_change_password === true &&
    pathname !== "/set-password" &&
    pathname !== "/api/auth/logout"
  ) {
    return redirectWithCookies(new URL("/set-password", request.url), getResponse());
  }

  if (pathname === "/") {
    if (!user) {
      return redirectWithCookies(new URL("/login", request.url), getResponse());
    }

    return getResponse();
  }

  if (user && pathname === "/login") {
    return redirectWithCookies(new URL("/", request.url), getResponse());
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isProtectedPath = protectedPathPrefixes.some((path) =>
    pathname.startsWith(path),
  );

  if (!user && isProtectedPath && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return redirectWithCookies(loginUrl, getResponse());
  }

  return getResponse();
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

export default proxy;

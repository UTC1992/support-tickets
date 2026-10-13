import { NextResponse, type NextRequest } from "next/server";
import createSupabaseProxyClient from "@/lib/auth/supabase-proxy";

const publicPaths = ["/login", "/auth/callback"];
const protectedPathPrefixes = ["/tickets", "/dashboard"];

const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const { supabase, getResponse } = createSupabaseProxyClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return getResponse();
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isProtectedPath = protectedPathPrefixes.some((path) =>
    pathname.startsWith(path),
  );

  if (!user && isProtectedPath && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

export default proxy;

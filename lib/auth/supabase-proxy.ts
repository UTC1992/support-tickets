import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import getSupabasePublicConfig from "@/lib/auth/env";

const createSupabaseProxyClient = (request: NextRequest) => {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabasePublicConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
};

export default createSupabaseProxyClient;

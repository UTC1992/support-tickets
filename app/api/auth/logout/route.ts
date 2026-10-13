import { NextResponse } from "next/server";
import createSupabaseServerClient from "@/lib/auth/supabase-server";

const POST = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", requestUrl.origin), {
    status: 303,
  });
};

export { POST };

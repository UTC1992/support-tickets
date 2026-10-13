"use client";

import { createBrowserClient } from "@supabase/ssr";
import getSupabasePublicConfig from "@/lib/auth/env";

const createSupabaseBrowserClient = () => {
  const { url, key } = getSupabasePublicConfig();
  return createBrowserClient(url, key);
};

export default createSupabaseBrowserClient;

"use client";

import { useEffect, useState } from "react";
import createSupabaseBrowserClient from "@/lib/auth/supabase-browser";
import type AuthSessionState from "@/features/auth/types";

const useSession = () => {
  const [state, setState] = useState<AuthSessionState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setState({ user: data.user, isLoading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, isLoading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
};

export default useSession;

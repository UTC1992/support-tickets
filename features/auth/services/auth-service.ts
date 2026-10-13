import createSupabaseBrowserClient from "@/lib/auth/supabase-browser";

export const signInWithPassword = async (email: string, password: string) => {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signOut();
};

export const getBrowserUser = async () => {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

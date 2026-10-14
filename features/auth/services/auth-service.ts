import createSupabaseBrowserClient from "@/lib/auth/supabase-browser";

export const signInWithPassword = async (identifier: string, password: string) => {
  const supabase = createSupabaseBrowserClient();
  const normalizedIdentifier = identifier.trim();

  if (normalizedIdentifier.includes("@")) {
    return supabase.auth.signInWithPassword({
      email: normalizedIdentifier.toLowerCase(),
      password,
    });
  }

  return supabase.auth.signInWithPassword({
    phone: normalizedIdentifier.replace(/[\s()-]/g, ""),
    password,
  });
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

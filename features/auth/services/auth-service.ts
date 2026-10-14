import createSupabaseBrowserClient from "@/lib/auth/supabase-browser";
import { getPhoneAuthEmail } from "@/lib/services/phone";

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
    email: getPhoneAuthEmail(normalizedIdentifier),
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

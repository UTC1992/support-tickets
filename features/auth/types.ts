import type { User } from "@supabase/supabase-js";

type AuthSessionState = {
  user: User | null;
  isLoading: boolean;
};

export type { AuthSessionState as default };

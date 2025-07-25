"use client";

import { createClient } from "@/lib/supabase/client";
import { env } from "@/config/env";

export const googleSignIn = async () => {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.APP_URL}/api/auth/google/callback`,
    },
  });
};
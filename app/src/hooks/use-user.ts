'use client';

import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setIsLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, isLoading };
}

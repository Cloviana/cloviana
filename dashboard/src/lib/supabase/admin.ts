import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

export const supabaseAdmin = createClient(
  env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

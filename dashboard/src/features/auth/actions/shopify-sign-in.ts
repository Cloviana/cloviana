'use server';

import { env } from '@/config/env';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function shopifySignIn(shop: string) {
  const supabase = createClient();
  const supabaseAdmin = getSupabaseAdmin();

  const email = `${shop.replace(/\./g, '_')}@shops.cloviana.app`;

  const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { shop_domain: shop },
  });

  if (createUserError) {
    const code = (createUserError as any).code || '';
    const msg = createUserError.message || '';
    const ignore =
      code === 'email_exists' || /already\s+been?\s+registered/i.test(msg);
    if (!ignore) throw createUserError;
  }

  const linkRes = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${env.APP_URL}/auth/finish` },
  });

  const token_hash = linkRes.data.properties!.hashed_token!;
  const { data, error } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash,
  });
  if (error) throw error;

  return data.user;
}

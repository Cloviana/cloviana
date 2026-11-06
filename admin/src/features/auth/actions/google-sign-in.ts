'use client';

import { paths } from '@/config/paths';
import { platformAuth } from '@/lib/platform-auth/client';

export const googleSignIn = async () => {
  await platformAuth.signIn.social({
    provider: 'google',
    callbackURL: paths.home.getHref(),
  });
};

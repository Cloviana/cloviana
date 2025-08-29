'use client';

import Image from 'next/image';

import { Anchor } from '@/components/actions';
import { paths } from '@/config/paths';
import { AuthForm } from '@/features/auth/components/auth-form';
import { AuthRootLayout } from '@/features/auth/components/auth-layout';

export default function SignupPage() {
  return (
    <AuthRootLayout>
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center gap-8">
          <Image
            src="/logo-icon.png"
            width={30}
            height={30}
            alt="Cloviana Logo"
          />
        </div>
        <h1 className="text-3xl font-semibold">Welcome to Cloviana</h1>
        <p className="text-sm text-neutral-500">
          Already have an account?{' '}
          <Anchor href={paths.auth.login.getHref()}>Log in</Anchor>
        </p>

        <AuthForm className="mt-8" />
      </div>
    </AuthRootLayout>
  );
}

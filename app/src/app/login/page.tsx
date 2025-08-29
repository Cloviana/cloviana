'use client';

import Image from 'next/image';

import { Anchor } from '@/components/actions';
import { paths } from '@/config/paths';
import { AuthForm } from '@/features/auth/components/auth-form';
import { AuthRootLayout } from '@/features/auth/components/auth-layout';

export default function LoginPage() {
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
        <h1 className="text-3xl font-semibold">Welcome back to Cloviana</h1>
        <p className="text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Anchor href={paths.auth.signup.getHref()}>Sign up</Anchor>
        </p>

        <AuthForm className="mt-8" />
      </div>
    </AuthRootLayout>
  );
}

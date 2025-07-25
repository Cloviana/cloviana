import Image from 'next/image';

import { Anchor } from '@/components/actions';
import { paths } from '@/config/paths';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata = {
  title: 'Login - Cloviana',
  description: 'Showcasing Best Practices For Building React Applications',
};

export default function Page() {
  return (
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
        Don't have an account?{' '}
        <Anchor href={paths.auth.signup.getHref()}>Sign up</Anchor>
      </p>
      <LoginForm />
    </div>
  );
}

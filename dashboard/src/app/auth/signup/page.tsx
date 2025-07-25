import Image from 'next/image';

import { Anchor } from '@/components/actions';
import { paths } from '@/config/paths';
import { SignupForm } from '@/features/auth/components/signup-form';

export const metadata = {
  title: 'Sign up - Cloviana',
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
      <h1 className="text-3xl font-semibold">Welcome to Cloviana</h1>
      <p className="text-sm text-neutral-500">
        Already have an account?{' '}
        <Anchor href={paths.auth.login.getHref()}>Log in</Anchor>
      </p>
      <SignupForm />
    </div>
  );
}

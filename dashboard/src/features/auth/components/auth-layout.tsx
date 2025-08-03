import Image from 'next/image';
import { FC, memo, ReactNode } from 'react';

import { Anchor } from '@/components/actions';
import {
  BusinessInsiderLogo,
  CnnLogo,
  ForbesLogo,
  FoxLogo,
  RollingStoneLogo,
} from '@/components/icons';
import { SplitLayout } from '@/components/layout';
import { paths } from '@/config/paths';

interface AuthLayoutProps {
  children: ReactNode;
}

const logos = [
  RollingStoneLogo,
  ForbesLogo,
  FoxLogo,
  BusinessInsiderLogo,
  CnnLogo,
];

const AuthMarketing: FC = memo(function AuthMarketing() {
  return (
    <>
      <Image
        src="https://cloviana-assets.azureedge.net/assets/seascape_rhapsody_20250705T120000Z.png"
        alt="Store background"
        fill
        priority
        fetchPriority="high"
        className="absolute left-0 top-0 z-10 size-full rounded-xl object-cover"
      />
      <div className="relative z-30 flex h-full max-w-[500px] flex-col justify-between">
        <p className="text-2xl font-semibold leading-tight lg:text-[2rem]">
          Sell smarter. Grow faster. Automatically.
        </p>
        <div className="hidden flex-wrap justify-center gap-6 text-white lg:flex">
          {logos.map((Logo, i) => (
            <Logo key={i} className="h-5 w-auto" />
          ))}
        </div>
      </div>
    </>
  );
});

export const AuthLayout: FC<AuthLayoutProps> = ({ children }) => (
  <SplitLayout
    left={
      <div className="flex w-full max-w-[500px] flex-col justify-between gap-8">
        <div>{children}</div>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-500">
            By continuing you confirm you agree to Cloviana.com contacting you
            about our product and services. You can opt out at any time by
            clicking unsubscribe in our emails. Find out more about how we use
            data in our{' '}
            <Anchor href={paths.regulations.privacyPolicy.getHref()}>
              privacy policy
            </Anchor>
          </p>
          <p className="text-sm text-neutral-500">
            Looking for more info? Visit our{' '}
            <Anchor href="https://cloviana.com">website</Anchor>
          </p>
        </div>
      </div>
    }
    right={<AuthMarketing />}
  />
);

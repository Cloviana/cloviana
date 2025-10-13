import { FC, memo, ReactNode } from 'react';

import { Anchor } from '@/components/deprecated/actions';
import {
  BusinessInsiderLogo,
  CnnLogo,
  ForbesLogo,
  FoxLogo,
  RollingStoneLogo,
} from '@/components/deprecated/icons';
import { SplitLayout } from '@/components/deprecated/layout';
import { paths } from '@/config/paths';

interface AuthRootLayoutProps {
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
      <video
        src="https://cloviana-assets.azureedge.net/assets/4426378-uhd_2560_1440_25fps.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        //poster="https://cloviana-assets.azureedge.net/assets/seascape_rhapsody_20250705T120000Z.png"
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

export const AuthRootLayout: FC<AuthRootLayoutProps> = memo(
  function AuthRootLayout({ children }) {
    return (
      <SplitLayout
        left={
          <div className="flex w-full max-w-[500px] flex-col justify-between gap-8">
            <div>{children}</div>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-neutral-500">
                By continuing you confirm you agree to Cloviana.com contacting
                you about our product and services. You can opt out at any time
                by clicking unsubscribe in our emails. Find out more about how
                we use data in our{' '}
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
  },
);

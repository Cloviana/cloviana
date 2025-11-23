'use client';

import Image from 'next/image';

import { OnboardingAccountChip } from '@/features/auth/components/onboarding-account-chip';

export const OnboardingHeader = () => {
  return (
    <nav className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2">
        <div className="flex shrink-0 items-center gap-x-4">
          <Image
            src="/logo-icon.png"
            width={125}
            height={125}
            alt="Cloviana Logo"
            className="size-[18px]"
          />
        </div>
        <div className="flex items-center">
          <OnboardingAccountChip />
        </div>
      </div>
    </nav>
  );
};

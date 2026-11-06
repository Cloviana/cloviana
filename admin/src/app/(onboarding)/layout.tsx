import Image from 'next/image';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { getMe } from '@/features/profiles/api/get-me';

// Lives outside (dashboard) because that layout redirects here until onboarding is done.
export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const me = await getMe();

  if (me.onboardedAt) {
    redirect(paths.home.getHref());
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 sm:px-8 lg:px-12">
      <Image
        // TEMPORARY placeholder (Luma's logo): replace before release.
        src="/logo-full.svg"
        width={73}
        height={18}
        unoptimized
        alt="Cloviana"
        priority
        className="mt-6 h-5 w-auto self-start"
      />
      <main className="flex flex-1 items-center justify-center py-8">
        {children}
      </main>
    </div>
  );
}

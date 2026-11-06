import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { getMarketplace } from '@/features/marketplaces/api/get-marketplace';
import { getMe } from '@/features/profiles/api/get-me';

// Lives outside (dashboard) so the editor is full-screen, without the marketplace shell.
// That means it repeats the checks the dashboard layouts make.
export default async function ThemeEditorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const me = await getMe();
  if (!me.onboardedAt) {
    redirect(paths.onboarding.getHref());
  }

  if (!(await getMarketplace(slug))) notFound();

  return <div className="flex min-h-dvh flex-col">{children}</div>;
}

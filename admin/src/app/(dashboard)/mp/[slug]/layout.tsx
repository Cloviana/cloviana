import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { getMarketplace } from '@/features/marketplaces/api/get-marketplace';

// The dashboard shell for one marketplace. The API only returns marketplaces the signed-in
// user owns, so anything else is a 404.
export default async function MarketplaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const marketplace = await getMarketplace(slug);
  if (!marketplace) notFound();

  // The sidebar writes this cookie when toggled; reading it here avoids a flash on reload.
  const store = await cookies();
  const defaultOpen = store.get('sidebar_state')?.value !== 'false';

  return (
    <AppShell marketplace={marketplace} defaultOpen={defaultOpen}>
      {children}
    </AppShell>
  );
}

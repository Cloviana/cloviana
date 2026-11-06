import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { listMarketplaces } from '@/features/marketplaces/api/list-marketplaces';

// The dashboard lives under a marketplace; send people to their first one.
export default async function HomePage() {
  const [first] = await listMarketplaces();

  if (first) {
    redirect(paths.mp.home.getHref(first.slug));
  }

  return <p className="text-body p-8">You don't have a marketplace yet.</p>;
}

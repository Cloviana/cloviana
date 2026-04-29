import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { getBusinessEntry } from '@/features/businesses/api/business-entry';

export default async function BusinessEntryPage() {
  const entry = await getBusinessEntry();

  if (entry.destination === 'setup') {
    if (entry.businessId) {
      redirect(paths.setup.business.detail.getHref(entry.businessId));
    }

    redirect(paths.setup.business.getHref());
  }

  redirect(paths.business.getHref(entry.businessId ?? undefined));
}

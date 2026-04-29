import 'server-only';

import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { getBusiness } from '@/features/businesses/api/get-business';

export async function requireBusinessSubscription(businessId: string) {
  const business = await getBusiness(businessId);

  if (!business.subscription) {
    redirect(paths.business.trial.getHref(businessId));
  }
}

import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  redirect(paths.business.settings.subscription.getHref(businessId));
}

import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { getMe } from '@/features/profiles/api/get-me';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getMe();

  // The onboarding route must live outside this layout, or this redirect loops.
  if (!me.onboardedAt) {
    redirect(paths.onboarding.getHref());
  }

  return children;
}

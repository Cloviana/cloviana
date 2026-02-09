import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

export default async function RootPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  redirect(paths.store.blogs.getHref(storeId));
}

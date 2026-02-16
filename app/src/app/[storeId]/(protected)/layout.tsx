import { ReactNode } from 'react';

import { requireStoreSubscription } from '@/features/stores/guards/require-store-subscription';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const { storeId } = await params;
  await requireStoreSubscription(storeId);

  return children;
}

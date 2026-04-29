import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function Layout({ children }: LayoutProps) {
  //const { businessId } = await params;
  // /await requireBusinessSubscription(businessId);

  return children;
}

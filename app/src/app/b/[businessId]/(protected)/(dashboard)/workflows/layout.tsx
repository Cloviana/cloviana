import type { ReactNode } from 'react';

import { WorkflowsLayoutShell } from '@/features/workflows/components/workflows-layout-shell';

type WorkflowsLayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function WorkflowsLayout({
  children,
  params,
}: WorkflowsLayoutProps) {
  const { businessId } = await params;

  return (
    <WorkflowsLayoutShell businessId={businessId}>
      {children}
    </WorkflowsLayoutShell>
  );
}

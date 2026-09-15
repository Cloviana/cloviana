'use client';

import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';
import { PageTabs } from '@/features/dashboard/components/page-tabs';

type WorkflowsLayoutShellProps = {
  businessId: string;
  children: ReactNode;
};

export function WorkflowsLayoutShell({
  businessId,
  children,
}: WorkflowsLayoutShellProps) {
  const pathname = usePathname();
  const workflowsHref = paths.business.workflows.getHref(businessId);
  const templatesHref = paths.business.workflows.templates.getHref(businessId);
  const isListPage = pathname === workflowsHref || pathname === templatesHref;

  if (!isListPage) return children;

  return (
    <DashboardPageLayout
      width="full"
      header={
        <PageHeader>
          <PageHeaderRow className="justify-between gap-4">
            <PageHeaderTitle>Workflows</PageHeaderTitle>
            <PageHeaderActions>
              <Button type="button" variant="primary" size="sm">
                <Plus />
                Create Workflow
              </Button>
            </PageHeaderActions>
          </PageHeaderRow>
          <PageHeaderRow>
            <PageTabs
              tabs={[
                {
                  value: 'workflows',
                  label: 'Workflows',
                  href: workflowsHref,
                },
                {
                  value: 'templates',
                  label: 'Templates',
                  href: templatesHref,
                },
              ]}
            />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      {children}
    </DashboardPageLayout>
  );
}

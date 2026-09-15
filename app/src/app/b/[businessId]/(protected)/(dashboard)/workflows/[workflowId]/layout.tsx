import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { paths } from '@/config/paths';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';
import { PageTabs } from '@/features/dashboard/components/page-tabs';
import { mockWorkflowSummaries } from '@/mocks/data/workflows';

type WorkflowLayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string; workflowId: string }>;
};

export default async function WorkflowLayout({
  children,
  params,
}: WorkflowLayoutProps) {
  const { businessId, workflowId } = await params;
  const workflow = mockWorkflowSummaries.find((item) => item.id === workflowId);

  if (!workflow) notFound();

  const workflowHref = paths.business.workflows.detail.getHref(
    businessId,
    workflowId,
  );

  return (
    <DashboardPageLayout
      width="full"
      header={
        <PageHeader>
          <PageHeaderRow>
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={paths.business.workflows.getHref(businessId)}>
                      Workflows
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbLink asChild>
                    <Link href={workflowHref} className="truncate">
                      {workflow.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate">
                    Edit workflow
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageHeaderRow>
          <PageHeaderRow>
            <PageHeaderTitle className="truncate">
              {workflow.name}
            </PageHeaderTitle>
          </PageHeaderRow>
          <PageHeaderRow>
            <PageTabs
              tabs={[
                {
                  value: 'workflow',
                  label: 'Workflow',
                  href: workflowHref,
                },
                {
                  value: 'settings',
                  label: 'Settings',
                  href: paths.business.workflows.detail.settings.getHref(
                    businessId,
                    workflowId,
                  ),
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

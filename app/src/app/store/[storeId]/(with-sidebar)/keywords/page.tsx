'use client';

import { useParams } from 'next/navigation';

import { useGetKeywords } from '@/api/keywords/get-keywords';
import { Page } from '@/components/deprecated/layout';

import { DashboardShell } from '../_components/dashboard-shell';

import { columns } from './_components/columns';
import { DataTable } from './_components/data-table';

export default function KeywordsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data } = useGetKeywords(storeId);

  if (!data) return null;

  return (
    <DashboardShell>
      <Page.Root>
        <Page.Header>
          <Page.Title>Keywords</Page.Title>
        </Page.Header>
        <Page.Content className="overflow-y-auto">
          <DataTable columns={columns} data={data} />
        </Page.Content>
      </Page.Root>
    </DashboardShell>
  );
}

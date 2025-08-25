'use client';

import { useParams } from 'next/navigation';

import { useGetKeywords } from '@/api/keywords/get-keywords';
import { Page } from '@/components/layout';

import { columns } from './_components/columns';
import { DataTable } from './_components/data-table';

export default function KeywordsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data } = useGetKeywords(storeId);

  if (!data) return null;

  return (
    <Page.Root>
      <Page.Header>
        <Page.Title>Keywords</Page.Title>
      </Page.Header>
      <Page.Content className="overflow-y-auto">
        <DataTable columns={columns} data={data} />
      </Page.Content>
    </Page.Root>
  );
}

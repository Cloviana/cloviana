'use client';

import { useParams } from 'next/navigation';
import { FC } from 'react';

import { useGetProducts } from '@/api/products/get-products';
import { Page } from '@/components/layout';

import { DashboardShell } from '../_components/dashboard-shell';

import { DataTable } from './_components/data-table';
import { SyncProductsButton } from './_components/sync-products-button';

const ProductsPage: FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: products = [] } = useGetProducts(storeId);

  return (
    <DashboardShell>
      <Page.Root>
        <Page.Header className="flex items-center justify-between gap-2">
          <Page.Title>Products</Page.Title>
          <SyncProductsButton storeId={storeId} />
        </Page.Header>

        <Page.Content className="overflow-y-auto">
          <DataTable products={products} />
        </Page.Content>
      </Page.Root>
    </DashboardShell>
  );
};

export default ProductsPage;

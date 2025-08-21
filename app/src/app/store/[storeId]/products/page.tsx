'use client';

import { useParams } from 'next/navigation';
import { FC } from 'react';

import { useGetProducts } from '@/api/products/get-products';
import * as Page from '@/components/layout/page';

import { ProductsTable } from './_components/products-table';
import { SyncProductsButton } from './_components/sync-products-button';

const ProductsPage: FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: products = [] } = useGetProducts(storeId);

  return (
    <Page.Root>
      <Page.Header className="flex items-center justify-between gap-2">
        <Page.Title>Products</Page.Title>
        <SyncProductsButton storeId={storeId} />
      </Page.Header>

      <Page.Content className="overflow-y-auto">
        <ProductsTable products={products} />
      </Page.Content>
    </Page.Root>
  );
};

export default ProductsPage;

'use client';

import { FC, useMemo, useState } from 'react';

import * as Page from '@/components/layout/page';
import { IndexTable, SortConfig } from '@/components/table/index-table';

// Sample product data
const products = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?fit=crop&crop=center',
    status: 'Active',
    handle: 'wireless-bluetooth-headphones',
    lastUpdated: 'Mar 14',
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?fit=crop&crop=center',
    status: 'Active',
    handle: 'smart-watch-series-5',
    lastUpdated: 'Mar 14',
  },
  {
    id: '3',
    name: 'Laptop Stand Adjustable',
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?fit=crop&crop=center',
    status: 'Draft',
    handle: 'laptop-stand-adjustable',
    lastUpdated: 'Mar 14',
  },
  {
    id: '4',
    name: 'USB-C Hub Multi-Port',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?fit=crop&crop=center',
    status: 'Active',
    handle: 'usb-c-hub-multi-port',
    lastUpdated: 'Mar 14',
  },
  {
    id: '5',
    name: 'Wireless Charging Pad',
    image:
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?fit=crop&crop=center',
    status: 'Inactive',
    handle: 'wireless-charging-pad',
    lastUpdated: 'Mar 14',
  },
  {
    id: '6',
    name: 'Mechanical Keyboard RGB',
    image:
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?fit=crop&crop=center',
    status: 'Active',
    handle: 'mechanical-keyboard-rgb',
    lastUpdated: 'Mar 14',
  },
];

const ProductsPage: FC = () => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedProducts = useMemo(() => {
    if (!sortConfig) return products;

    const { key, direction } = sortConfig;
    return [...products].sort((a, b) => {
      const aVal = a[key as keyof typeof a];
      const bVal = b[key as keyof typeof b];

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      const result = aStr.localeCompare(bStr);
      return direction === 'asc' ? result : -result;
    });
  }, [sortConfig]);

  const handleSort = (newSortConfig: SortConfig | null) => {
    setSortConfig(newSortConfig);
  };

  return (
    <Page.Root>
      <Page.Header className="flex items-center justify-between gap-2">
        <Page.Title>Products</Page.Title>
        <Page.Button
          icon="sync"
          allowIconColor={false}
          iconClassName="text-foreground-light"
        >
          Sync
        </Page.Button>
      </Page.Header>

      <Page.Content className="overflow-y-auto">
        <IndexTable
          headings={[
            {
              title: 'Title',
              width: 600,
              className: 'text-foreground',
            },
            {
              title: 'Status',
              width: 120,
            },
            {
              title: 'Handle',
              width: 250,
            },
            {
              title: 'Last Updated',
              width: 180,
            },
          ]}
          onSort={handleSort}
        >
          {sortedProducts.map((product) => (
            <IndexTable.Row key={product.id} id={product.id}>
              <IndexTable.Cell>
                <div className="flex items-center gap-3">
                  <div className="size-8 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 font-medium">
                    <p className="truncate text-xs">{product.name}</p>
                  </div>
                </div>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <span className="text-xs font-normal text-foreground-light">
                  {product.status}
                </span>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <span className="text-xs font-normal text-foreground-light">
                  {product.handle}
                </span>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <span className="text-xs font-normal text-foreground-light">
                  {product.lastUpdated}
                </span>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Page.Content>
    </Page.Root>
  );
};

export default ProductsPage;

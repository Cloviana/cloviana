'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useGetLatestJobStatus } from '@/api/jobs/get-latest-job-status';
import { productKeys } from '@/api/keys';
import { useSyncProducts } from '@/api/products/sync-products';
import { Page } from '@/components/deprecated/layout';

export function SyncProductsButton({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncMutation = useSyncProducts(storeId);

  const { data: latestStatus } = useGetLatestJobStatus(
    storeId,
    'PRODUCT_SYNC',
    {
      queryConfig: { enabled: isSyncing, refetchInterval: 3000 },
    },
  );

  useEffect(() => {
    if (!isSyncing) return;
    if (latestStatus?.status === 'SUCCESS') {
      qc.invalidateQueries({ queryKey: productKeys.list(storeId) });
      setIsSyncing(false);
    }
    if (latestStatus?.status === 'FAILED') {
      setIsSyncing(false);
    }
  }, [isSyncing, latestStatus, qc, storeId]);

  return (
    <Page.Button
      icon="sync"
      allowIconColor={false}
      iconClassName="text-foreground-light"
      onClick={() => {
        if (isSyncing) return;
        setIsSyncing(true);
        syncMutation.mutate();
      }}
      disabled={isSyncing}
    >
      {isSyncing ? 'Syncing…' : 'Sync'}
    </Page.Button>
  );
}

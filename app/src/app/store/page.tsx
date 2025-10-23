'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { useGetStores } from '@/api/stores/get-stores';
import { paths } from '@/config/paths';

export default function Page() {
  const router = useRouter();
  const { data: stores, isLoading } = useGetStores();
  const activeStores = useMemo(
    () => stores?.filter((s) => s.status !== 'DRAFT') ?? [],
    [stores],
  );

  useEffect(() => {
    if (!isLoading && activeStores.length) {
      router.replace(paths.store.getHref(activeStores[0].id));
    }
  }, [isLoading, activeStores, router]);

  return (
    <div className="bg-background flex h-screen items-center justify-center">
      <div className="animate-pulse">
        <Image
          src={'/logo-icon.png'}
          width={35}
          height={35}
          alt="logo"
          className="logo-swing"
        />
      </div>
    </div>
  );
}

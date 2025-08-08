'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { paths } from '@/config/paths';

export const Logo = () => {
  const { storeId } = useParams();
  return (
    <Link href={paths.store.getHref(storeId as string)}>
      <img src="/logo-full.png" alt="logo" className="h-auto w-[77px]" />
    </Link>
  );
};

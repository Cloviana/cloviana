'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

import { Button, type ButtonProps } from '@/components/ui/button';
import { paths } from '@/config/paths';

export function CreateStoreButton({
  slug,
  size,
}: Pick<ButtonProps, 'size'> & { slug: string }) {
  return (
    <Button
      size={size}
      nativeButton={false}
      render={<Link href={paths.mp.stores.create.getHref(slug)} />}
    >
      <PlusIcon />
      Add store
    </Button>
  );
}

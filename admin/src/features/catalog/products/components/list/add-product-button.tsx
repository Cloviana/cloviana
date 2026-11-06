'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Button, type ButtonProps } from '@/components/ui/button';
import { paths } from '@/config/paths';

export function AddProductButton({ size }: Pick<ButtonProps, 'size'>) {
  const { slug } = useParams<{ slug: string }>();

  return (
    <Button
      size={size}
      nativeButton={false}
      render={<Link href={paths.mp.products.create.getHref(slug)} />}
    >
      <PlusIcon />
      Add product
    </Button>
  );
}

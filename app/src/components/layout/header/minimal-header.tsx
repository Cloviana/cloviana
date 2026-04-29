'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { paths } from '@/config/paths';

export const MinimalHeader = () => {
  const { businessId } = useParams<{ businessId?: string }>();

  return (
    <nav className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex shrink-0 items-center gap-x-4">
          <Link href={paths.business.getHref(businessId)}>
            <Image
              src="/logo-icon.png"
              width={125}
              height={125}
              alt="Cloviana Logo"
              className="size-[20px] transition-transform hover:rotate-12"
            />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {/*<MinimalAccountChip />*/}
        </div>
      </div>
    </nav>
  );
};

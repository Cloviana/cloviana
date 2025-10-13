import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { GIcon } from '@/components/deprecated/icons';
import { paths } from '@/config/paths';

export const Header = () => {
  const { storeId } = useParams<{ storeId: string }>();
  return (
    <header className="flex w-full items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <Link href={paths.store.blogs.getHref(storeId)}>
          <Image alt="logo" src="/logo-icon.png" width={20} height={20} />
        </Link>
        <span className="text-sm font-medium">Create Blog</span>
      </div>
      <Link
        href={paths.store.blogs.getHref(storeId)}
        className="flex size-8 items-center justify-center rounded-md hover:bg-gray-200"
      >
        <GIcon name="close" />
      </Link>
    </header>
  );
};

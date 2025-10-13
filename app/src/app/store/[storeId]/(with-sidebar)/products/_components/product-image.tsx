import Image from 'next/image';
import { FC } from 'react';

import { GIcon } from '@/components/deprecated/icons';
import { cn } from '@/utils/cn';

type Props = { url?: string; alt?: string };

const ProductImage: FC<Props> = ({ url, alt }) => {
  const hasImage = !!url;

  return (
    <div
      className={cn(
        'bg-surface-200 flex size-8 shrink-0 items-center justify-center rounded-lg',
        hasImage && 'overflow-hidden',
      )}
    >
      {hasImage ? (
        <Image
          src={url!}
          alt={alt || 'Product image'}
          width={32}
          height={32}
          priority
          fetchPriority="high"
          className="size-full object-cover"
        />
      ) : (
        <GIcon
          name="question_mark"
          size={20}
          className="text-foreground-lighter"
        />
      )}
    </div>
  );
};

export default ProductImage;

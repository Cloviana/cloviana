import React, { FC } from 'react';

import { GIcon } from '@/components/icons';

const ProductImage: FC<{ url?: string; alt?: string }> = ({ url, alt }) => {
  const hasImage = Boolean(url);

  return (
    <React.Fragment>
      {hasImage ? (
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-200">
          <img
            src={url}
            alt={alt || 'Product image'}
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-200">
          <GIcon
            name="question_mark"
            size={20}
            className="text-foreground-lighter"
          />
        </div>
      )}
    </React.Fragment>
  );
};

export default ProductImage;

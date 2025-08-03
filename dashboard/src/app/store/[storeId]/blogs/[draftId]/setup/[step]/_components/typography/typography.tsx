import { FC, HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

export const Title: FC<HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h1 className={cn('text-lg font-semibold', className)} {...props}>
    {children}
  </h1>
);

export const Subtitle: FC<HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn('text-foreground-light', className)} {...props}>
    {children}
  </p>
);

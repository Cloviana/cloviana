import { FC, HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

type SectionProps = HTMLAttributes<HTMLDivElement>;

export const Section: FC<SectionProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    {...props}
    className={cn('overflow-hidden px-4 py-4 md:px-5', className)}
  >
    {children}
  </div>
);

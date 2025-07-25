import { DialogTitleProps, Title as TitleRX } from '@radix-ui/react-dialog';
import { FC } from 'react';

import { cn } from '@/utils/cn';

interface TitleProps extends DialogTitleProps {}

export const Title: FC<TitleProps> = ({ children, className, ...props }) => (
  <TitleRX {...props} className={cn('text-base font-normal', className)}>
    {children}
  </TitleRX>
);

import { cva } from 'class-variance-authority';
import { FC, HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const formLayoutVariants = cva('flex flex-col gap-y-4');
const groupVariants = cva('flex flex-row gap-x-4');

export interface FormLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export interface FormLayoutGroupProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

const Root: FC<FormLayoutProps> = ({ children, className, ...rest }) => (
  <div className={cn(formLayoutVariants(), className)} {...rest}>
    {children}
  </div>
);

const Group: FC<FormLayoutGroupProps> = ({ children, className, ...rest }) => (
  <div className={cn(groupVariants(), className)} {...rest}>
    {children}
  </div>
);

type FormLayoutType = FC<FormLayoutProps> & { Group: FC<FormLayoutGroupProps> };

export const FormLayout: FormLayoutType = Object.assign(Root, { Group });

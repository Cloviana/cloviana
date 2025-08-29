import { cva, VariantProps } from 'class-variance-authority';
import { FC, HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const layoutVariants = cva('grid gap-x-4 md:grid-cols-12');

interface LayoutProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof layoutVariants> {
  children?: ReactNode;
}

const LayoutRoot: FC<LayoutProps> = ({ children, className, ...rest }) => (
  <div className={cn(layoutVariants(), className)} {...rest}>
    {children}
  </div>
);

const sectionVariants = cva('mt-5 first:mt-0', {
  variants: {
    variant: {
      full: 'md:col-span-12',
      oneHalf: 'md:col-span-6',
      oneThird: 'md:col-span-4',
      twoThirds: 'md:col-span-8',
      oneFourth: 'md:col-span-3',
    },
  },
  defaultVariants: {
    variant: 'full',
  },
});

interface SectionProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  children?: ReactNode;
}

const Section: FC<SectionProps> = ({
  children,
  variant,
  className,
  ...rest
}) => (
  <section className={cn(sectionVariants({ variant }), className)} {...rest}>
    {children}
  </section>
);

export const Layout = Object.assign(LayoutRoot, { Section });

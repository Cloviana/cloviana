import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import type { AnchorHTMLAttributes, FC, ReactNode } from 'react';

import { cn } from '@/lib/utils';

const anchorVariants = cva('underline-offset-2', {
  variants: {
    variant: {
      dashed: 'underline decoration-dashed hover:decoration-solid',
      hover: 'no-underline decoration-solid hover:underline',
    },
    tone: {
      primary: 'text-link-default active:text-link-pressed',
      inherit: 'text-inherit',
    },
  },
  defaultVariants: {
    variant: 'dashed',
    tone: 'primary',
  },
});

export interface AnchorProps
  extends
    AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof anchorVariants> {
  href: string;
  scroll?: boolean;
  children: ReactNode;
  className?: string;
  external?: boolean;
}

export const Anchor: FC<AnchorProps> = ({
  href,
  children,
  className,
  variant,
  tone,
  external = false,
  ...rest
}) => {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Link
      href={href}
      className={cn(anchorVariants({ variant, tone }), className)}
      {...externalProps}
      {...rest}
    >
      {children}
    </Link>
  );
};

export { anchorVariants };

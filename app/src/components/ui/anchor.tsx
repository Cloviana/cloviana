import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import type { AnchorHTMLAttributes, FC, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const anchorVariants = cva(
  'underline decoration-dashed underline-offset-4 transition-[opacity,text-decoration-style] hover:opacity-80',
  {
    variants: {
      variant: {
        primary: 'text-primary',
        inherit: 'text-inherit',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-[13px]',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface AnchorProps
  extends
    AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof anchorVariants> {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  dataPrimaryLink?: boolean;
}

export const Anchor: FC<AnchorProps> = ({
  href,
  children,
  className,
  dataPrimaryLink,
  variant,
  size,
  external = false,
  ...rest
}) => {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Link
      href={href}
      className={cn(anchorVariants({ variant, size }), className)}
      data-primary-link={dataPrimaryLink}
      {...externalProps}
      {...rest}
    >
      {children}
    </Link>
  );
};

export { anchorVariants };

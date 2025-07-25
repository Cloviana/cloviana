import { cva, VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { AnchorHTMLAttributes, FC, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const anchorVariants = cva('underline transition-opacity duration-150', {
  variants: {
    variant: {
      default: 'text-primary hover:opacity-90',
      dark: 'text-foreground hover:opacity-90',
      subtle: 'opacity-80 hover:text-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface AnchorProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
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
  external = false,
  ...rest
}) => {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Link
      href={href}
      className={cn(anchorVariants({ variant }), className)}
      data-primary-link={dataPrimaryLink}
      {...externalProps}
      {...rest}
    >
      {children}
    </Link>
  );
};

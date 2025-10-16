import { cva, VariantProps } from 'class-variance-authority';
import Link, { LinkProps } from 'next/link';
import { ButtonHTMLAttributes, forwardRef, ReactNode, Ref } from 'react';

import { cn } from '@/utils/cn';

import { LoadingSpinner } from '../animations';
import { GIcon } from '../icons';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-x-2 rounded-md transition-all duration-300 ease-out disabled:opacity-80',
  {
    variants: {
      variant: {
        primary:
          'border-primary/20 bg-linear-to-b from-primary/90 to-primary border text-white hover:opacity-85',
        secondary: 'border-border/70 border hover:border-gray-500/50',
        tertiary: 'shadow-none! hover:bg-surface-200',
        plain: 'p-0! font-normal! text-primary! shadow-none! hover:opacity-80',
        green: 'bg-[#5e8e3e] text-white hover:bg-[#548136]',
      },
      size: {
        sm: 'h-6 px-2.5 text-xs font-medium',
        md: 'h-10 px-5 text-sm font-medium',
        lg: 'h-12 px-5 text-base font-medium',
      },
      fullWidth: {
        true: 'w-full',
      },
      textAlign: {
        start: 'text-start',
        center: 'text-center',
        end: 'text-end',
        left: 'text-left',
        right: 'text-right',
      },
    },
  },
);

type Variant = VariantProps<typeof buttonVariants>;

type CommonProps = Variant & {
  children?: ReactNode;
  icon?: string;
  url?: string;
  external?: boolean;
  loading?: boolean;
  submit?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  className?: string;
  allowIconColor?: boolean;
  iconClassName?: string;
};

type NativeProps = ButtonHTMLAttributes<HTMLButtonElement>;
type LinkOnlyProps = Pick<
  LinkProps,
  'prefetch' | 'replace' | 'scroll' | 'shallow' | 'locale'
>;

export type ButtonProps = CommonProps & (NativeProps | LinkOnlyProps);

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(
  {
    children,
    className,
    icon,
    url,
    external = false,
    loading = false,
    submit = false,
    type,
    variant = 'secondary',
    size = 'md',
    fullWidth = false,
    textAlign = 'start',
    allowIconColor = true,
    iconClassName,
    ...rest
  },
  ref,
) {
  const classes = cn(
    buttonVariants({ variant, size, fullWidth, textAlign }),
    className,
  );
  const buttonType = type ?? (submit ? 'submit' : 'button');
  const isPlain = variant === 'plain';

  const iconNode = icon && (
    <GIcon
      name={icon}
      size={16}
      className={cn(
        allowIconColor &&
          (variant === 'primary' ? 'fill-white' : 'fill-foreground-light'),
        iconClassName,
      )}
      aria-hidden={loading}
    />
  );

  const textNode = children && (
    <span
      className={cn(
        isPlain && 'underline',
        loading && 'opacity-0',
        'whitespace-nowrap',
      )}
      aria-hidden={loading}
    >
      {children}
    </span>
  );

  const spinnerNode = loading && !url && (
    <LoadingSpinner className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
  );

  const content = (
    <>
      {iconNode}
      {textNode}
      {spinnerNode}
    </>
  );

  if (url) {
    const linkProps = rest as LinkOnlyProps;
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={url}
        className={classes}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...linkProps}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = rest as NativeProps;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={buttonType}
      className={classes}
      disabled={loading}
      {...buttonProps}
    >
      {content}
    </button>
  );
});

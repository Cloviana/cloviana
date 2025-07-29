import { cva, VariantProps } from 'class-variance-authority';
import Link, { LinkProps } from 'next/link';
import {
  ButtonHTMLAttributes,
  FC,
  forwardRef,
  ReactNode,
  Ref,
  SVGProps,
} from 'react';

import { cn } from '@/utils/cn';

import { LoadingSpinner } from '../animations';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-x-2 rounded-full transition-all duration-300 ease-out disabled:opacity-80',
  {
    variants: {
      variant: {
        primary:
          'border border-primary/20 bg-gradient-to-b from-primary/90 to-primary text-white hover:opacity-85',
        secondary:
          'border border-border/70 hover:border-gray-500/50 bg-white/10 backdrop-blur',
        tertiary: '!shadow-none hover:bg-surface-200',
        plain: '!p-0 !font-normal !text-primary !shadow-none hover:opacity-80',
      },
      size: {
        sm: 'h-6 px-2.5 text-xs font-medium',
        md: 'h-9 px-5 text-sm font-medium',
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
  icon?: FC<SVGProps<SVGSVGElement>>;
  url?: string;
  external?: boolean;
  loading?: boolean;
  submit?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  className?: string;
  allowIconColor?: boolean;
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
    icon: Icon,
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

  const iconNode = Icon && (
    <Icon
      width={16}
      height={16}
      className={cn(
        allowIconColor &&
          (variant === 'primary' ? 'fill-white' : 'fill-foreground-light'),
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
    <LoadingSpinner className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
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

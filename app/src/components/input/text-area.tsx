// src/components/input/text-area.tsx
'use client';

import { cva, VariantProps } from 'class-variance-authority';
import { forwardRef, TextareaHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const textAreaVariants = cva(
  [
    'text-foreground transition-shadow w-full duration-300 border border-gray-200 placeholder:text-foreground-lighter/90',
    'rounded-md focus:outline-none focus:ring focus:ring-gray-300/30',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-[13px]',
        lg: 'px-4 py-3 text-sm',
      },
      variant: {
        default: 'bg-white shadow-inner',
        surface: 'bg-surface-100',
        error: 'border-red-500 bg-red-50 placeholder:text-red-500',
        ghost: 'border-0 bg-transparent focus:ring-0',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textAreaVariants> {
  label?: string;
  helpText?: string;
  error?: string;
  icon?: ReactNode; // if you want prefix icons here too
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      helpText,
      error,
      size = 'md',
      variant = 'default',
      className,
      rows = 4,
      icon,
      ...rest
    },
    ref,
  ) => {
    return (
      <div className="flex w-full flex-col items-start">
        {label && (
          <span className="mb-1 text-xs font-medium text-foreground-light">
            {label}
          </span>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-3">
              {icon}
            </div>
          )}
          <textarea
            ref={ref}
            rows={rows}
            className={cn(
              textAreaVariants({ size, variant: error ? 'error' : variant }),
              icon ? 'pl-8' : '',
              'resize-none',
              className,
            )}
            {...rest}
          />
        </div>
        {helpText && (
          <span className="mt-1 text-xs text-foreground-lighter">
            {helpText}
          </span>
        )}
        {error && (
          <div className="mt-2 text-xs font-medium text-red-600">{error}</div>
        )}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

export { TextArea };

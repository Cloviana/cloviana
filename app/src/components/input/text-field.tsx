'use client';

import { cva, VariantProps } from 'class-variance-authority';
import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';

import { cn } from '@/utils/cn';

import { CrossedEyeIcon, EyeIcon } from '../icons';

const textFieldVariants = cva(
  [
    'text-foreground transition-shadow w-full duration-300 border border-gray-200 placeholder:text-foreground-lighter/90 ',
    'rounded-md focus:outline-none focus:ring focus:ring-gray-300/30',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-[13px]',
        lg: 'h-10 px-4 text-sm',
      },
      variant: {
        default: 'bg-white shadow-inner',
        surface: 'bg-surface-100',
        error: 'border-red-500 bg-red-50 placeholder:text-red-500',
        ghost: 'border-0 bg-transparent focus:ring-0',
      },
    },
  },
);

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof textFieldVariants> {
  error?: string;
  label?: string;
  helpText?: string;
  icon?: ReactNode;
}

const ErrorText = ({ children }: { children: string }) => {
  return (
    <div className="mt-2 inline-flex items-center gap-x-2">
      {/*<ExclamationIcon width={12} height={12} className="fill-red-600" />*/}
      <span className="text-xs font-medium text-red-600">{children}</span>
    </div>
  );
};

const LabelText = ({ children }: { children: string }) => {
  return (
    <span className="mb-1 text-xs font-medium text-foreground-light">
      {children}
    </span>
  );
};

const HelpText = ({ children }: { children: string }) => {
  return (
    <span className="mt-1 text-xs font-normal text-foreground-lighter">
      {children}
    </span>
  );
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      error,
      size = 'lg',
      variant = 'default',
      className,
      type,
      helpText,
      icon,
      ...rest
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className={'flex w-full flex-col items-start'}>
        {label && <LabelText>{label}</LabelText>}
        <div className="relative w-full">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              {icon}
            </div>
          )}
          <input
            className={cn(
              textFieldVariants({ size, variant: error ? 'error' : variant }),
              isPassword && 'pr-10',
              icon && 'pl-8',
              className,
            )}
            type={isPassword && showPassword ? 'text' : type}
            {...rest}
            ref={ref}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={cn(
              'absolute inset-y-0 right-4 flex items-center',
              !isPassword && 'hidden',
            )}
          >
            {showPassword ? (
              <EyeIcon className="size-3.5 fill-foreground-lighter" />
            ) : (
              <CrossedEyeIcon className="size-3.5 fill-foreground-lighter" />
            )}
          </button>
        </div>
        {helpText && <HelpText>{helpText}</HelpText>}
        {error && <ErrorText>{error}</ErrorText>}
      </div>
    );
  },
);

TextField.displayName = 'TextField';

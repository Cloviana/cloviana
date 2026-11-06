import { Input as InputPrimitive } from '@base-ui/react/input';
import * as React from 'react';

import { cn } from '@/lib/utils';

const inputSizes = {
  default: 'h-8',
  xs: 'h-8 md:h-6 text-body-large md:text-body py-0.5',
  sm: 'h-8 text-body-large md:text-body',
  lg: 'h-10',
};

export type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  size?: keyof typeof inputSizes;
};

function Input({ className, type, size = 'default', ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'border-line border-border-input bg-background-input text-text-default enabled:hover:bg-background-input-hovered enabled:active:bg-background-input-pressed enabled:hover:not-focus-visible:not-aria-invalid:border-border-input-hovered text-body-large file:text-body file:text-text-default placeholder:text-text-subtlest focus-visible:border-border-focused focus-visible:ring-border-focused/20 disabled:border-border-disabled disabled:bg-background-disabled disabled:text-text-disabled disabled:placeholder:text-text-disabled aria-invalid:border-border-danger aria-invalid:bg-background-danger aria-invalid:enabled:hover:bg-background-danger-hovered aria-invalid:enabled:active:bg-background-danger-pressed md:text-body w-full min-w-0 rounded-md px-3 py-1 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed',
        inputSizes[size],
        '[&::-webkit-search-cancel-button]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export { Input };

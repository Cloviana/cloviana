import React, { forwardRef } from 'react';

import { cn } from '@/utils/cn';

interface CommandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  highlight?: boolean;
}

const CommandButton = forwardRef<HTMLButtonElement, CommandButtonProps>(
  ({ children, className, disabled, highlight = false, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center rounded-md px-2 py-1 transition-colors',
        highlight
          ? 'bg-surface-200 text-foreground'
          : 'text-foreground-light/70 hover:bg-surface-200',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {children}
    </button>
  ),
);

CommandButton.displayName = 'CommandButton';

export default CommandButton;

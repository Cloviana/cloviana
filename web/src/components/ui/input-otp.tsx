'use client';

import { OTPInput, OTPInputContext } from 'input-otp';
import { MinusIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// ─── InputOTP ────────────────────────────────────────────────────────────────

type InputOTPProps = React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
};

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  InputOTPProps
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    data-slot="input-otp"
    containerClassName={cn(
      'flex items-center has-disabled:opacity-50',
      containerClassName,
    )}
    // `caret-transparent` ensures the browser treats the hidden
    // input as "active" for keystroke capture across all browsers.
    className={cn('caret-transparent disabled:cursor-not-allowed', className)}
    spellCheck={false}
    {...props}
  />
));
InputOTP.displayName = 'InputOTP';

// ─── InputOTPGroup ────────────────────────────────────────────────────────────

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        'flex items-center rounded-lg',
        'has-aria-invalid:border-destructive has-aria-invalid:ring-3',
        'has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

// ─── InputOTPSlot ─────────────────────────────────────────────────────────────

type InputOTPSlotProps = React.ComponentProps<'div'> & { index: number };

function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const { slots } = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        // Base
        'relative flex items-center justify-center',
        'size-8 border-y border-r text-sm outline-none',
        'transition-all first:rounded-l-lg first:border-l last:rounded-r-lg',
        // Colors
        'border-input dark:bg-input/30',
        // Active state
        'data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:z-10 data-[active=true]:ring-3',
        // Invalid state
        'aria-invalid:border-destructive',
        'data-[active=true]:aria-invalid:border-destructive',
        'data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && <FakeCaret />}
    </div>
  );
}

function FakeCaret() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
    </div>
  );
}

// ─── InputOTPSeparator ────────────────────────────────────────────────────────

function InputOTPSeparator(props: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      {...props}
    >
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };

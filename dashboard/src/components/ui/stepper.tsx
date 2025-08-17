import React from 'react';

import { cn } from '@/utils/cn';

type StepperProps = {
  total: number;
  value?: number;
  onChange?: (next: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  disabledSteps?: number[];
  activeClassName?: string;
  inactiveClassName?: string;
};

const sizeMap = {
  sm: 'h-2 w-10 rounded-sm',
  md: 'h-3 w-14 rounded-sm',
  lg: 'h-3.5 w-16 rounded-sm',
};

export function Stepper({
  total,
  value = 0,
  onChange,
  size = 'md',
  className,
  disabled = false,
  disabledSteps = [],
  activeClassName = 'bg-primary',
  inactiveClassName = 'bg-surface-300',
}: StepperProps) {
  const clamped = Math.max(0, Math.min(total - 1, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i <= clamped;
        const isDisabled = disabled || disabledSteps.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange?.(i)}
            className={cn(
              'transition-colors focus:outline-none',
              sizeMap[size as keyof typeof sizeMap],
              isActive ? activeClassName : inactiveClassName,
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
            aria-label={`Step ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

'use client';

import { cn } from '@/utils/cn';

type BusinessSetupProgressProps = {
  currentStepIndex: number;
  totalSteps: number;
};

export function BusinessSetupProgress({
  currentStepIndex,
  totalSteps,
}: BusinessSetupProgressProps) {
  return (
    <div
      className="grid w-full gap-2"
      style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={cn(
            'h-1 rounded-full transition-colors',
            index < currentStepIndex ? 'bg-primary' : 'bg-muted',
          )}
        />
      ))}
    </div>
  );
}

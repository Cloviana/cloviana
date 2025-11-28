import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useDrafter } from '@/features/blogs/context/drafter';
import { cn } from '@/utils/cn';

export const ViewActions = ({
  onNext,
  onPrev,
  isNextDisabled,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  onNext?: () => Promise<void> | void;
  onPrev?: () => Promise<void> | void;
  isNextDisabled?: boolean;
}) => {
  const { steps, currentKey, goNext, goPrev } = useDrafter();
  const idx = useMemo(
    () => steps.findIndex((s) => s.key === currentKey),
    [steps, currentKey],
  );
  const hasPrev = idx > 0;
  const [loading, setLoading] = useState<'next' | 'prev' | null>(null);

  const handleNext = async () => {
    if (loading) return;
    setLoading('next');
    try {
      if (onNext) await onNext();
      goNext();
    } finally {
      setLoading(null);
    }
  };

  const handlePrev = async () => {
    if (loading) return;
    setLoading('prev');
    try {
      if (onPrev) await onPrev();
      goPrev();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-end">
      <div
        className={cn(
          'flex w-full items-end justify-end gap-2 px-6 py-5 sm:px-11',
          className,
        )}
        {...props}
      >
        {hasPrev && (
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrev}
            disabled={loading === 'prev'}
          >
            Back
          </Button>
        )}
        <Button
          variant="secondary"
          size="lg"
          onClick={handleNext}
          disabled={!!isNextDisabled}
          loading={loading === 'next'}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

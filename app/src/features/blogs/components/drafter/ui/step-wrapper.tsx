import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { cn } from '@/utils/cn';

interface StepWrapperProps {
  className?: string;
  children?: React.ReactNode;
  title: string;
  description: string;
  onNext?: () => void;
  onBack?: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
}

export const StepWrapper = ({
  className,
  children,
  title,
  description,
  onBack,
  onNext,
  isNextDisabled,
  isNextLoading,
}: StepWrapperProps) => {
  const { currentIndex } = useDrafter();

  const canGoBack = currentIndex > 0 && !!onBack;

  return (
    <div
      className={cn('mx-auto flex w-full max-w-6xl flex-col gap-2', className)}
    >
      <div className="bg-background sticky top-0 z-10">
        <div className="flex flex-col justify-between gap-4 pt-8 pb-3 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-foreground-lighter max-w-[90ch] text-sm">
              {description}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              size="default"
              variant="outline"
              onClick={onBack}
              disabled={!canGoBack}
            >
              Previous
            </Button>
            <Button
              size="default"
              variant="secondary"
              onClick={onNext}
              disabled={isNextDisabled}
              loading={isNextLoading}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative pb-8">{children}</div>
    </div>
  );
};

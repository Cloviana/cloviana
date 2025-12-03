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
  onNext,
  onBack,
  isNextDisabled,
  isNextLoading,
}: StepWrapperProps) => {
  const { currentIndex } = useDrafter();

  const canGoBack = currentIndex > 0 && !!onBack;

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col gap-6 px-6 py-9 sm:px-11',
        className,
      )}
    >
      <div className="min-h-0 flex-1">
        <div className="no-scrollbar h-full overflow-y-auto">
          <div className="mb-4 space-y-px">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-foreground-light text-sm">{description}</p>
          </div>
          <div className="relative">{children}</div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {canGoBack && (
          <Button size="lg" variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        <Button
          size="lg"
          variant="secondary"
          onClick={onNext}
          disabled={isNextDisabled}
          loading={isNextLoading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

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
        // CHANGED: Removed px-6 py-9 sm:px-11 and gap-6 from here.
        // We want the container to be full width so the internal scrollbar is at the edge.
        'flex h-full min-h-0 flex-col',
        className,
      )}
    >
      <div className="min-h-0 flex-1">
        <div
          // CHANGED: Moved padding (px-6 py-9) HERE.
          // This allows the "ring" to bleed into the padding area without getting clipped by the scroll view.
          className="no-scrollbar h-full overflow-y-auto px-6 py-9 sm:px-11"
        >
          <div className="mb-4 space-y-px">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-foreground-light text-sm">{description}</p>
          </div>
          {/* Optional: Add p-1 to be extra safe for large rings, but usually not needed with the padding move */}
          <div className="relative -m-1 p-1">{children}</div>
        </div>
      </div>

      {/* CHANGED: Added padding to the Footer so it aligns visually with the content above */}
      <div className="flex items-center justify-end gap-2 px-6 pt-4 pb-9 sm:px-11">
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

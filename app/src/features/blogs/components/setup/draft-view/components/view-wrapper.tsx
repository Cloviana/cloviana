import { ReactNode } from 'react';

import { ViewActions } from '@/features/blogs/components/setup/draft-view/components/view-actions';
import { cn } from '@/utils/cn';

export const ViewWrapper = ({
  children,
  onNext,
  onPrev,
  isNextDisabled,
  className,
}: {
  children: ReactNode;
  onNext?: () => Promise<void> | void;
  onPrev?: () => Promise<void> | void;
  isNextDisabled?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'mx-auto flex h-full w-full flex-col overflow-hidden',
        className,
      )}
    >
      <div className="min-h-0 w-full flex-1 overflow-y-auto">{children}</div>
      <ViewActions
        onNext={onNext}
        onPrev={onPrev}
        isNextDisabled={isNextDisabled}
      />
    </div>
  );
};

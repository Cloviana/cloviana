'use client';

import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type BusinessSetupActionsProps = {
  canGoBack?: boolean;
  isSubmitting?: boolean;
  isContinueDisabled?: boolean;
  onBack?: () => void;
  continueLabel?: string;
};

export function BusinessSetupActions({
  canGoBack = true,
  isSubmitting = false,
  isContinueDisabled = false,
  onBack,
  continueLabel = 'Continue',
}: BusinessSetupActionsProps) {
  return (
    <div className="space-y-3 pt-2">
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        disabled={isContinueDisabled}
      >
        {continueLabel}
        <ChevronRight className="size-3.5" strokeWidth={2.5} />
      </Button>

      {canGoBack && onBack ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
      ) : null}
    </div>
  );
}

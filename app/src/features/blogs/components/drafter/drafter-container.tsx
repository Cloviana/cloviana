'use client';

import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { DrafterKey } from '@/features/blogs/components/drafter/drafter.config';
import {
  AudienceIntentStep,
  GuidelinesStep,
  PrimaryKeywordStep,
  ProductStep,
  SecondaryKeywordsStep,
  TopicStep,
} from '@/features/blogs/components/drafter/steps';
import { Sidebar } from '@/features/blogs/components/drafter/ui/sidebar';
import { cn } from '@/utils/cn';

const STEP_COMPONENTS: Record<DrafterKey, React.ComponentType> = {
  product: ProductStep,
  'audience-intent': AudienceIntentStep,
  topic: TopicStep,
  'primary-keyword': PrimaryKeywordStep,
  'secondary-keywords': SecondaryKeywordsStep,
  guidelines: GuidelinesStep,
};

export const DrafterContainer = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  const { currentKey } = useDrafter();
  const CurrentStepComponent = STEP_COMPONENTS[currentKey] ?? ProductStep;

  return (
    <div className={cn('flex h-full min-h-0', className)} {...props}>
      <Sidebar className="border-r" />

      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full min-h-0">
          <CurrentStepComponent />
        </div>
      </main>
    </div>
  );
};

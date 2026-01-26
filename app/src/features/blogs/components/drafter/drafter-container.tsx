'use client';

import { useMemo } from 'react';

import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { DrafterKey } from '@/features/blogs/components/drafter/drafter.config';
import {
  ContentTypeStep,
  PrimaryKeywordStep,
  ProductStep,
  SecondaryKeywordsStep,
  TopicStep,
} from '@/features/blogs/components/drafter/steps';
import { cn } from '@/utils/cn';

const STEP_COMPONENTS: Record<DrafterKey, React.ComponentType> = {
  'content-type': ContentTypeStep,
  product: ProductStep,
  topic: TopicStep,
  'primary-keyword': PrimaryKeywordStep,
  'secondary-keywords': SecondaryKeywordsStep,
};

export const DrafterContainer = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  const { currentKey } = useDrafter();

  const CurrentStepComponent = useMemo(
    () => STEP_COMPONENTS[currentKey] ?? ProductStep,
    [currentKey],
  );

  return (
    <div className={cn(className)} {...props}>
      <CurrentStepComponent />
    </div>
  );
};

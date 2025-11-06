import { FC } from 'react';

import { cn } from '@/utils/cn';

interface CustomerStoriesProps {
  className?: string;
}

export const CustomerStories: FC<CustomerStoriesProps> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global relative')}>
      <div className="padding-section-medium container"></div>
    </section>
  );
};

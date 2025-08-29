import { useParams } from 'next/navigation';

import { useGetBlog } from '@/api/blogs/get-blog';

import { StepItem } from './components/step-item';
import { STEPS } from './constants/steps';

export const Sidebar = () => {
  const { draftId } = useParams<{ draftId: string }>();
  const { data: blog } = useGetBlog({ blogId: draftId });
  if (!blog) return null;

  const current = blog.generationStep ?? 'TOPIC';
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <aside className="flex w-full flex-col">
      <div className="border-b px-5 py-3">
        <h3>Complete blog setup</h3>
        <p className="text-xs text-foreground-lighter">
          This setup is important in order to create quality content.
        </p>
      </div>
      <div className="flex-1 space-y-3 p-3">
        {STEPS.map(({ key, label }, idx) => {
          const status =
            idx < currentIndex
              ? 'complete'
              : idx === currentIndex
                ? 'current'
                : 'upcoming';
          return (
            <StepItem key={key} status={status}>
              {label}
            </StepItem>
          );
        })}
      </div>
    </aside>
  );
};

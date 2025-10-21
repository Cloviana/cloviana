import { useEffect, useState } from 'react';

import { useGetBlog } from '@/api/blogs/get-blog';
import { useUpdateBlog } from '@/api/blogs/update-blog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/ui/page';
import { useGetTopicSuggestions } from '@/features/blogs/api/get-topic-suggestions';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';

export const TopicView = () => {
  const { blogId, getNextStepEnum } = useDrafter();
  const { data: blog } = useGetBlog({ blogId });
  const { mutateAsync: update } = useUpdateBlog();
  const { data: suggestions = [], isLoading } = useGetTopicSuggestions({
    blogId,
  });

  const [value, setValue] = useState('');
  useEffect(() => {
    if (blog?.topic) setValue(blog.topic);
  }, [blog?.topic]);

  const trimmed = value.trim();
  const disabled = !trimmed || trimmed === (blog?.topic ?? '').trim();
  const nextEnum = getNextStepEnum();

  const save = async () => {
    await update({
      blogId,
      topic: trimmed,
      currentStep: nextEnum as BlogSetupStep,
    });
  };

  if (isLoading) {
    return <ViewLoading />;
  }

  return (
    <ViewWrapper onNext={save} isNextDisabled={disabled}>
      <Page>
        <PageHeader>
          <PageTitle>Topic</PageTitle>
          <PageParagraph>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium.
          </PageParagraph>
        </PageHeader>
        <PageContent>
          <div className="grid w-full gap-3">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              type="text"
              size="lg"
              variant="white"
              placeholder="Enter your article's topic here"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-foreground-lighter text-xs font-medium underline">
              Suggested Topics
            </span>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setValue(suggestion)}
                className="text-foreground-light cursor-pointer text-sm font-medium decoration-dashed hover:underline"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </PageContent>
      </Page>
    </ViewWrapper>
  );
};

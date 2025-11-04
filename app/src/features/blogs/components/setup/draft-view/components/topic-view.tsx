import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/ui/page';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useGetTopicSuggestions } from '@/features/blogs/api/get-topic-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';

export const TopicView = () => {
  const { getNextStepEnum } = useDrafter();
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();

  const { data: blog } = useGetBlog({ blogId, storeId });
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
      storeId,
    });
  };

  if (isLoading) {
    return <ViewLoading />;
  }

  return (
    <ViewWrapper onNext={save} isNextDisabled={disabled}>
      <Page>
        <PageHeader>
          <PageTitle>Choose a Topic</PageTitle>
          <PageParagraph>
            Pick the main theme for your article. This helps Cloviana understand
            what your blog should focus on before generating ideas and keywords.
          </PageParagraph>
        </PageHeader>
        <PageContent>
          <div className="grid w-full gap-3">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              type="text"
              size="lg"
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

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
import { useGetTitleSuggestions } from '@/features/blogs/api/get-title-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';

export const TitleView = () => {
  const { getNextStepEnum } = useDrafter();
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();

  const { data: blog } = useGetBlog({ blogId, storeId });
  const { mutateAsync: update } = useUpdateBlog();
  const { data: suggestions = [], isLoading } = useGetTitleSuggestions({
    blogId,
    topic: blog?.topic ?? '',
    primaryKeyword: blog?.primaryKeyword ?? '',
  });

  const [value, setValue] = useState('');
  useEffect(() => {
    if (blog?.title) setValue(blog.title);
  }, [blog?.title]);

  const trimmed = value.trim();
  const disabled = !trimmed || trimmed === (blog?.title ?? '').trim();
  const nextEnum = getNextStepEnum();

  const save = async () => {
    await update({
      blogId,
      title: trimmed,
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
          <PageTitle>Blog Title</PageTitle>
          <PageParagraph>
            Choose a clear, engaging title for your article. Cloviana will
            suggest options based on your topic and keyword, or you can write
            your own.
          </PageParagraph>
        </PageHeader>
        <PageContent>
          <div className="grid w-full gap-3">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              size="lg"
              variant="white"
              placeholder="Enter your article's title here"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-foreground-lighter text-xs font-medium underline">
              Suggested Titles
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

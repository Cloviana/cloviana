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
import { useGetTitleSuggestions } from '@/features/blogs/api/get-title-suggestions';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';

export const TitleView = () => {
  const { blogId, getNextStepEnum } = useDrafter();
  const { data: blog } = useGetBlog({ blogId });
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
    });
  };

  if (isLoading) {
    return <ViewLoading />;
  }

  return (
    <ViewWrapper onNext={save} isNextDisabled={disabled}>
      <Page>
        <PageHeader>
          <PageTitle>Title</PageTitle>
          <PageParagraph>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium.
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

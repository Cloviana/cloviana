import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useGetBlog } from '@/api/blogs/get-blog';
import { updateBlogInputSchema, useUpdateBlog } from '@/api/blogs/update-blog';
import { useGetTitleSuggestions } from '@/api/suggestions/title-suggestions/get-title-suggestions';
import { PageActions } from '@/components/actions';
import { TextField } from '@/components/input';
import { Page } from '@/components/layout';

import { Subtitle, Title } from '../_components/typography';

export const TitleView = () => {
  const { storeId, draftId: blogId } = useParams<{
    storeId: string;
    draftId: string;
  }>();
  const { data: blog } = useGetBlog({
    blogId,
    queryConfig: { suspense: true },
  });
  const { data: suggestions = [] } = useGetTitleSuggestions({
    storeId,
    blogId,
  });
  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const [title, setTitle] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleUpdateBlog = async () => {
    const validated = updateBlogInputSchema.parse({
      blogId,
      title,
      generationStep: 'META',
    });
    await updateBlog(validated);
  };

  useEffect(() => {
    if (blog?.title) {
      setTitle(blog.title);
    }
  }, [blog]);

  if (!blog) return null;

  return (
    <Page>
      <div className="space-y-5">
        <div className="space-y-1">
          <Title>Choose Your Title</Title>
          <Subtitle>
            Craft an engaging headline to capture your audience’s attention.
          </Subtitle>
        </div>
        <div className="space-y-2">
          <TextField
            size="md"
            placeholder="Enter your blog's title here"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="space-y-1.5">
            {showSuggestions && (
              <div className="space-y-2">
                <p>AI suggestions:</p>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTitle(suggestion)}
                    className="w-full rounded-md bg-slate-50 px-2 py-1.5 text-left text-sm text-slate-800 underline decoration-dotted transition-colors hover:bg-slate-100/60 hover:decoration-solid"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowSuggestions((prev) => !prev)}
              className="text-foreground-light underline decoration-dotted underline-offset-[3px] transition-colors hover:text-foreground/90"
            >
              {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
            </button>
          </div>
        </div>
      </div>
      <PageActions
        primaryAction={{
          children: 'Continue',
          size: 'md',
          loading: isPending,
          onClick: handleUpdateBlog,
          disabled: !title,
        }}
      />
    </Page>
  );
};

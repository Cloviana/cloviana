import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetBlog } from '@/api/blogs/get-blog';
import { updateBlogInputSchema, useUpdateBlog } from '@/api/blogs/update-blog';
import { useGetTopicSuggestions } from '@/api/suggestions/topic-suggestions/get-topic-suggestions';
import { PageActions } from '@/components/deprecated/actions';
import { TextField } from '@/components/deprecated/input';
import { Page } from '@/components/deprecated/legacy';

import { Subtitle, Title } from '../_components/typography';

export const TopicView = () => {
  const { storeId, draftId } = useParams<{
    storeId: string;
    draftId: string;
  }>();
  const { data: suggestions } = useGetTopicSuggestions({ storeId });
  const { data: blog } = useGetBlog({ blogId: draftId });
  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const [topic, setTopic] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleUpdateBlog = async () => {
    const validated = updateBlogInputSchema.parse({
      blogId: draftId,
      topic,
      generationStep: 'KEYWORD',
    });
    await updateBlog(validated);
  };

  useEffect(() => {
    if (blog?.topic) {
      setTopic(blog.topic);
    }
  }, [blog]);

  if (!blog) return null;

  return (
    <Page>
      <div className="space-y-5">
        <div className="space-y-1">
          <Title>Choose Your Topic</Title>
          <Subtitle>
            Define the key elements to tailor your content for targeted impact.
          </Subtitle>
        </div>
        <div className="space-y-2">
          <TextField
            size={'md'}
            placeholder="Enter your blog's topic here"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="space-y-1.5">
            {showSuggestions && suggestions && (
              <div className="space-y-2">
                <p>AI suggestions:</p>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(suggestion)}
                    className="w-full rounded-md bg-slate-50 px-2 py-1.5 text-left text-sm text-slate-800 underline decoration-dotted transition-colors hover:bg-slate-100/60 hover:decoration-solid"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowSuggestions((prevState) => !prevState)}
              className={
                'text-foreground-light hover:text-foreground/90 underline decoration-dotted underline-offset-[3px] transition-colors'
              }
            >
              {showSuggestions ? 'Hide' : 'Show suggestions'}
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
          disabled: !topic,
        }}
      />
    </Page>
  );
};

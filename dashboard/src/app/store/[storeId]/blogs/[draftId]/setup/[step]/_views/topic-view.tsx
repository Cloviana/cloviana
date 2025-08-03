import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetBlog } from '@/api/blogs/get-blog';
import { useGetTopicSuggestions } from '@/api/suggestions/topic-suggestions/get-topics-suggestions';
import { TextField } from '@/components/input';
import { Page } from '@/components/layout';
import { cn } from '@/utils/cn';

import { Subtitle, Title } from '../_components/typography';

export const TopicView = () => {
  const { storeId, draftId } = useParams<{
    storeId: string;
    draftId: string;
  }>();
  const { data: suggestions } = useGetTopicSuggestions({ storeId });
  const { data: blog } = useGetBlog({ blogId: draftId });

  const [topic, setTopic] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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
            <button
              onClick={() => setShowSuggestions(true)}
              className={cn(
                !showSuggestions &&
                  'text-foreground-light underline decoration-dotted underline-offset-[3px] transition-colors hover:text-foreground/90',
              )}
              disabled={showSuggestions}
            >
              {showSuggestions ? 'AI suggestions:' : 'Show suggestions'}
            </button>

            {showSuggestions && suggestions && (
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(suggestion)}
                    className="w-full rounded-md bg-purple-50 px-2 py-1.5 text-left text-sm text-purple-800 underline decoration-dotted transition-colors hover:bg-purple-100/60 hover:decoration-solid"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};

'use client';

import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';

import { updateBlogInputSchema, useUpdateBlog } from '@/api/blogs/update-blog';
import { useGetKeywords } from '@/api/keywords/get-keywords';
import { useGetKeywordSuggestions } from '@/api/suggestions/keyword-suggestions/get-keyword-suggestions';
import { PageActions } from '@/components/deprecated/actions';
import { Autocomplete } from '@/components/deprecated/input';
import { Page } from '@/components/deprecated/legacy';

import { Title, Subtitle } from '../_components/typography';

export const KeywordView = () => {
  const { storeId, draftId } = useParams<{
    storeId: string;
    draftId: string;
  }>();
  const { data: keywords = [], isFetching: loading } = useGetKeywords(storeId);

  const { data: suggestions = [] } = useGetKeywordSuggestions({
    storeId,
    blogId: draftId,
  });

  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const options = useMemo(
    () => keywords.map(({ phrase, id }) => ({ label: phrase, value: id })),
    [keywords],
  );

  const [inputValue, setInputValue] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const re = new RegExp(inputValue, 'i');
    return options.filter((o) => re.test(o.label));
  }, [options, inputValue]);

  const handleSelect = (values: string[]) => {
    setSelectedValues(values);
    const match = options.find((o) => o.value === values[0]);
    setInputValue(match?.label ?? '');
  };

  const handleUpdateBlog = async () => {
    const validated = updateBlogInputSchema.parse({
      blogId: draftId,
      keywordId: selectedValues[0],
      generationStep: 'TITLE',
    });
    await updateBlog(validated);
  };

  return (
    <Page>
      <div className="space-y-5">
        <div className="space-y-1">
          <Title>Choose Your Keyword</Title>
          <Subtitle>
            Define the key elements to tailor your content for targeted impact.
          </Subtitle>
        </div>
        <Autocomplete
          textfield={
            <Autocomplete.TextField
              placeholder="Search by keyword"
              type="text"
              size="md"
              label="Primary Keyword"
              value={inputValue}
              onChange={(e) => setInputValue(e.currentTarget.value)}
              autoComplete="off"
              helpText="Keywords come from your blog’s keyword list. If you don’t see what you need, go to the Keywords page to add it."
            />
          }
          loading={loading}
          options={filteredOptions}
          selected={selectedValues}
          onSelect={handleSelect}
        />
        <div className="space-y-1.5">
          {showSuggestions && suggestions && (
            <div className="space-y-2">
              <p>AI suggestions:</p>
              {suggestions.map(({ phrase, id }, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedValues([id]);
                    setInputValue(phrase);
                  }}
                  className="w-full rounded-md bg-slate-50 px-2 py-1.5 text-left text-sm text-slate-800 underline decoration-dotted transition-colors hover:bg-slate-100/60 hover:decoration-solid"
                >
                  {phrase}
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
      <PageActions
        primaryAction={{
          children: 'Continue',
          size: 'md',
          disabled: !selectedValues.length,
          onClick: handleUpdateBlog,
          loading: isPending,
        }}
      />
    </Page>
  );
};

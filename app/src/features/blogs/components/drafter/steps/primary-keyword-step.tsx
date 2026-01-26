import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useGetPrimaryKeywordSuggestions } from '@/features/blogs/api/get-primary-keyword-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { KeywordsTable } from '@/features/blogs/components/drafter/ui/keywords-table';
import { StepLoading } from '@/features/blogs/components/drafter/ui/step-loading';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';
import { suggestionKeys } from '@/lib/react-query';

const formSchema = z.object({
  primaryKeyword: z.string().min(1, 'Primary keyword is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const PrimaryKeywordStep = () => {
  const { steps, currentIndex, storeId, blogId, goNext, goPrev } = useDrafter();
  const step = steps[currentIndex];

  const { data: blog, isLoading: isBlogLoading } = useGetBlog({
    storeId,
    blogId,
  });
  const qc = useQueryClient();

  const {
    data: keywords = [],
    isFetching: isSuggestionsFetching,
    isLoading: isSuggestionsLoading,
  } = useGetPrimaryKeywordSuggestions({ storeId, blogId });

  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { primaryKeyword: '' },
  });

  const { setValue, watch, handleSubmit, reset, formState } = form;
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const recommendedKeyword = useMemo(() => {
    const rec = keywords.find((k: any) => k?.recommended)?.keyword;
    return rec ?? keywords[0]?.keyword ?? null;
  }, [keywords]);

  useEffect(() => {
    if (!blog) return;
    const value = blog.primaryKeyword || '';
    reset({ primaryKeyword: value });
    setSelectedKeyword(value || null);
  }, [blog, reset]);

  useEffect(() => {
    if (!blog) return;
    if (blog.primaryKeyword) return;
    if (!recommendedKeyword) return;
    if (formState.isDirty) return;

    const current = watch('primaryKeyword');
    if (current) return;

    setSelectedKeyword(recommendedKeyword);
    setValue('primaryKeyword', recommendedKeyword, { shouldDirty: false });
  }, [blog, recommendedKeyword, formState.isDirty, setValue, watch]);

  const onSubmit = async (values: FormValues) => {
    const hasChanges = values.primaryKeyword !== blog?.primaryKeyword;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        primaryKeyword: values.primaryKeyword,
        secondaryKeywords: [],
        currentStep: steps[currentIndex + 1].dbEnum,
      });

      const invalidations = [
        qc.invalidateQueries({
          queryKey: suggestionKeys.primaryKeyword(storeId, blogId),
        }),
        qc.invalidateQueries({
          queryKey: suggestionKeys.secondaryKeywords(storeId, blogId),
        }),
      ];

      await Promise.all(invalidations);
    }

    goNext();
  };

  const handleNext = () => {
    handleSubmit(onSubmit)();
  };

  const handleToggle = (keyword: string) => {
    const newValue = selectedKeyword === keyword ? null : keyword;
    setSelectedKeyword(newValue);
    setValue('primaryKeyword', newValue || '', { shouldDirty: true });
  };

  const primaryKeyword = watch('primaryKeyword');
  const isFormValid = !!primaryKeyword;
  const showSuggestionsLoading = isSuggestionsLoading || isSuggestionsFetching;
  const hasSuggestions = keywords.length > 0;

  if (isBlogLoading || showSuggestionsLoading) return <StepLoading />;

  return (
    <StepWrapper
      title={step.title}
      description={step.description}
      onNext={handleNext}
      onBack={goPrev}
      isNextDisabled={!isFormValid}
      isNextLoading={isPending}
    >
      <div className="space-y-6">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="primaryKeyword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      size="lg"
                      variant="default"
                      placeholder="Choose or type a primary keyword"
                      onChange={(e) => {
                        field.onChange(e);
                        const v = e.target.value?.trim() ?? '';
                        setSelectedKeyword(v ? v : null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {showSuggestionsLoading && (
          <div className="text-muted-foreground text-sm">
            Loading keyword suggestions…
          </div>
        )}

        {!showSuggestionsLoading && hasSuggestions && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              Select one of the suggested primary keywords or type your own.
            </p>
            <KeywordsTable
              keywords={keywords}
              selected={selectedKeyword ? [selectedKeyword] : []}
              onToggle={handleToggle}
            />
          </div>
        )}

        {!showSuggestionsLoading && !hasSuggestions && (
          <p className="text-muted-foreground text-xs">
            No keyword suggestions available for this blog yet.
          </p>
        )}
      </div>
    </StepWrapper>
  );
};

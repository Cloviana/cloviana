import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useGetTopicSuggestions } from '@/features/blogs/api/get-topic-suggestions';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';

const formSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const TopicStep = () => {
  const { steps, currentIndex, storeId, blogId, goNext, goPrev } = useDrafter();

  const step = steps[currentIndex];
  const { data: blog } = useGetBlog({ storeId, blogId });
  const {
    data: topics,
    isFetching: isSuggestionsFetching,
    isLoading: isSuggestionsLoading,
  } = useGetTopicSuggestions({ storeId, blogId });

  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const { setValue, watch, handleSubmit, reset } = form;

  useEffect(() => {
    if (blog) {
      reset({
        topic: blog.topic || '',
      });
    }
  }, [blog, reset]);

  const onSubmit = async (values: FormValues) => {
    const hasChanges = values.topic !== blog?.topic;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        topic: values.topic,
        currentStep: steps[currentIndex + 1].dbEnum,
      });
    }
    goNext();
  };

  const handleNext = () => {
    handleSubmit(onSubmit)();
  };

  const watchedValues = watch();
  const isFormValid = !!watchedValues.topic;
  const showSuggestionsSkeleton = isSuggestionsLoading || isSuggestionsFetching;
  const hasSuggestions = !!topics && topics.length > 0;

  return (
    <StepWrapper
      title={step.title}
      description={step.description}
      onNext={handleNext}
      onBack={goPrev}
      isNextDisabled={!isFormValid}
      isNextLoading={isPending}
    >
      <Form {...form}>
        <form className="space-y-8">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-3">
                    <Input placeholder="Enter topic" size="lg" {...field} />
                    {showSuggestionsSkeleton && (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex flex-wrap gap-2">
                          <Skeleton className="h-7 w-36" />
                          <Skeleton className="h-7 w-40" />
                          <Skeleton className="h-7 w-32" />
                          <Skeleton className="h-7 w-44" />
                          <Skeleton className="h-7 w-34" />
                        </div>
                      </div>
                    )}
                    {!showSuggestionsSkeleton && hasSuggestions && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-foreground-lighter text-xs font-medium underline">
                          Suggested topics
                        </span>
                        {topics!.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setValue('topic', suggestion, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            className="text-foreground-light cursor-pointer text-sm font-medium decoration-dashed hover:underline"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </StepWrapper>
  );
};

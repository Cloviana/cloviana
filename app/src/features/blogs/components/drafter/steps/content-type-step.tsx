import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Columns, Lightbulb } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';
import { suggestionKeys } from '@/lib/react-query';
import { cn } from '@/utils/cn';

const formSchema = z.object({
  contentType: z.enum(['PROBLEM_SOLUTION', 'COMPARISON'], {
    message: 'Content type is required',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const CONTENT_TYPES = [
  {
    value: 'PROBLEM_SOLUTION' as const,
    title: 'Problem / Solution',
    description:
      'Best for educating and building trust before recommending a solution.',
    detail:
      'Use this format when the reader is trying to understand a problem, its causes, and what a good solution looks like. It works well for informational queries, objection handling, and warming the audience before introducing a product or framework.',
    icon: Lightbulb,
  },
  {
    value: 'COMPARISON' as const,
    title: 'Comparison',
    description: 'Best for high-intent shoppers choosing between options.',
    detail:
      'Use this format when the reader already wants a product and is deciding which option fits best. It supports side-by-side evaluation, clear criteria, and a confident final recommendation without overselling.',
    icon: Columns,
  },
] as const;

export const ContentTypeStep = () => {
  const { steps, currentIndex, storeId, blogId, goNext, goPrev } = useDrafter();
  const step = steps[currentIndex];

  const qc = useQueryClient();
  const { data: blog } = useGetBlog({ storeId, blogId });
  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const { reset, setValue, watch, handleSubmit } = form;

  useEffect(() => {
    if (!blog?.contentType) return;

    reset({
      contentType: blog.contentType ?? 'PROBLEM_SOLUTION',
    });
  }, [blog?.contentType, reset]);

  const onSubmit = async (values: FormValues) => {
    const hasChanges = values.contentType !== blog?.contentType;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        contentType: values.contentType,
        productIds: [],
        topic: null,
        primaryKeyword: null,
        secondaryKeywords: [],
        currentStep: steps[currentIndex + 1].dbEnum,
      });

      const invalidations = [
        qc.invalidateQueries({
          queryKey: suggestionKeys.topic(storeId, blogId),
        }),
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

  const watched = watch();
  const isFormValid = !!watched.contentType;

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
            name="contentType"
            render={() => (
              <FormItem>
                <FormControl>
                  <TooltipProvider>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {CONTENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const selected = watched.contentType === type.value;

                        return (
                          <Tooltip key={type.value}>
                            <TooltipTrigger asChild>
                              <Item
                                variant={'outline'}
                                className={cn(
                                  'hover:border-primary cursor-pointer border bg-white transition',
                                  selected && 'border-primary',
                                )}
                                onClick={() =>
                                  setValue('contentType', type.value, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                }
                                role="button"
                                aria-pressed={selected}
                                tabIndex={0}
                              >
                                <ItemContent className="flex flex-col gap-3">
                                  <div className="flex items-center gap-3">
                                    <ItemMedia>
                                      <Icon className="text-primary h-5 w-5" />
                                    </ItemMedia>
                                    <ItemTitle>{type.title}</ItemTitle>
                                  </div>
                                  <ItemDescription>
                                    {type.description}
                                  </ItemDescription>
                                </ItemContent>
                              </Item>
                            </TooltipTrigger>

                            <TooltipContent
                              side="bottom"
                              sideOffset={4}
                              align="start"
                              className="max-w-sm"
                            >
                              <p className="text-xs">{type.detail}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TooltipProvider>
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

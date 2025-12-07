import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';
import { SearchIntent } from '@/types/api';
import { cn } from '@/utils/cn';

const formSchema = z.object({
  targetPersona: z.string().min(1, 'Target persona is required'),
  searchIntent: z.enum([
    'INFORMATIONAL',
    'NAVIGATIONAL',
    'COMMERCIAL',
    'TRANSACTIONAL',
  ]),
});

type FormValues = z.infer<typeof formSchema>;

const INTENT_OPTIONS: {
  value: SearchIntent;
  title: string;
  description: string;
}[] = [
  {
    value: 'INFORMATIONAL',
    title: 'Informational',
    description: 'Readers researching a topic or question.',
  },
  {
    value: 'COMMERCIAL',
    title: 'Commercial',
    description: 'Readers comparing options before deciding what to buy.',
  },
];

export const AudienceIntentStep = () => {
  const { steps, currentIndex, storeId, blogId, goNext, goPrev } = useDrafter();

  const step = steps[currentIndex];
  const { data: blog } = useGetBlog({ storeId, blogId });
  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetPersona: '',
      searchIntent: undefined,
    },
  });

  useEffect(() => {
    if (blog) {
      form.reset({
        targetPersona: blog.targetPersona || '',
        searchIntent: blog.searchIntent || undefined,
      });
    }
  }, [blog, form]);

  const onSubmit = async (values: FormValues) => {
    const hasChanges =
      values.targetPersona !== blog?.targetPersona ||
      values.searchIntent !== blog?.searchIntent;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        targetPersona: values.targetPersona,
        searchIntent: values.searchIntent,
        currentStep: steps[currentIndex + 1].dbEnum,
      });
    }
    goNext();
  };

  const handleNext = () => {
    form.handleSubmit(onSubmit)();
  };

  const watchedValues = form.watch();
  const isFormValid = watchedValues.targetPersona && watchedValues.searchIntent;

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
            name="targetPersona"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target persona</FormLabel>
                <FormDescription>
                  Describe the primary reader this article should speak to.
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="Enter target persona"
                    size="lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="searchIntent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search intent</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid auto-rows-fr gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"
                  >
                    {INTENT_OPTIONS.map((option) => {
                      const isSelected = field.value === option.value;
                      return (
                        <div key={option.value} className="flex h-full">
                          <FormItem className="flex h-full w-full items-stretch gap-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem
                                value={option.value}
                                id={option.value}
                                className="sr-only"
                              />
                            </FormControl>
                            <label
                              htmlFor={option.value}
                              className={cn(
                                'flex w-full cursor-pointer flex-col rounded-lg border p-4 text-left text-sm transition-all',
                                isSelected
                                  ? 'border-secondary'
                                  : 'border-border hover:bg-black-50',
                              )}
                            >
                              <span className="font-medium">
                                {option.title}
                              </span>
                              <span className="text-foreground-light mt-1 text-xs">
                                {option.description}
                              </span>
                            </label>
                          </FormItem>
                        </div>
                      );
                    })}
                  </RadioGroup>
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

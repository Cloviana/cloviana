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
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';

const formSchema = z.object({
  targetPersona: z.string().min(1, 'Target persona is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const AudienceIntentStep = () => {
  const { steps, currentIndex, storeId, blogId, goNext, goPrev } = useDrafter();

  const step = steps[currentIndex];
  const { data: blog } = useGetBlog({ storeId, blogId });
  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetPersona: '',
    },
  });

  useEffect(() => {
    if (blog) {
      form.reset({
        targetPersona: blog.targetPersona || '',
      });
    }
  }, [blog, form]);

  const onSubmit = async (values: FormValues) => {
    const hasChanges = values.targetPersona !== blog?.targetPersona;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        targetPersona: values.targetPersona,
        currentStep: steps[currentIndex + 1].dbEnum,
      });
    }
    goNext();
  };

  const handleNext = () => {
    form.handleSubmit(onSubmit)();
  };

  const watchedValues = form.watch();
  const isFormValid = watchedValues.targetPersona;

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
        </form>
      </Form>
    </StepWrapper>
  );
};

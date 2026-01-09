import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { paths } from '@/config/paths';
import { useGenerateBlog } from '@/features/blogs/api/generate-blog';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';

const formSchema = z.object({
  brandVoice: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const GuidelinesStep = () => {
  const { steps, currentIndex, storeId, blogId, goPrev } = useDrafter();
  const { push } = useRouter();

  const step = steps[currentIndex];
  const { data: blog, isLoading: isBlogLoading } = useGetBlog({
    storeId,
    blogId,
  });

  const { mutateAsync: updateBlog, isPending: isUpdating } = useUpdateBlog();
  const { mutateAsync: generateBlog, isPending: isGenerating } =
    useGenerateBlog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandVoice: '',
    },
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (blog) {
      reset({
        brandVoice: blog.brandVoice || '',
      });
    }
  }, [blog, reset]);

  const onSubmit = async (values: FormValues) => {
    const hasChanges = values.brandVoice !== blog?.brandVoice;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        brandVoice: values.brandVoice || undefined,
        currentStep: 'COMPLETED',
      });
    }

    await generateBlog({ data: { storeId, blogId } });

    push(paths.store.blogs.editor.getHref(storeId, blogId));
    //goNext();
  };

  const handleNext = () => {
    handleSubmit(onSubmit)();
  };

  const isFormValid = true;
  const isPending = isUpdating || isGenerating;

  if (isBlogLoading) return null;

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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="brandVoice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Brand Voice & Tone{' '}
                  <span className="text-muted-foreground text-xs font-normal">
                    (Optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the tone (e.g., Professional, Witty, Authoritative, Friendly)..."
                    className="min-h-[120px] resize-none"
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

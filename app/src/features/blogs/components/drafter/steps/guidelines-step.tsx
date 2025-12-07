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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { paths } from '@/config/paths';
import { useGenerateBlog } from '@/features/blogs/api/generate-blog';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';

const formSchema = z.object({
  wordCount: z.enum(['SHORT', 'MEDIUM', 'LONG']),
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
      wordCount: 'SHORT',
      brandVoice: '',
    },
  });

  const { watch, handleSubmit, reset } = form;

  useEffect(() => {
    if (blog) {
      reset({
        wordCount: blog.wordCount || 'SHORT',
        brandVoice: blog.brandVoice || '',
      });
    }
  }, [blog, reset]);

  const onSubmit = async (values: FormValues) => {
    const hasChanges =
      values.wordCount !== blog?.wordCount ||
      values.brandVoice !== blog?.brandVoice;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        wordCount: values.wordCount,
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

  const watchedValues = watch();
  const isFormValid = !!watchedValues.wordCount;
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
            name="wordCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Word Budget</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a length" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SHORT">Short (400–800 words)</SelectItem>
                    <SelectItem value="MEDIUM">
                      Medium (800–1,500 words)
                    </SelectItem>
                    <SelectItem value="LONG">Long (1,500+ words)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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

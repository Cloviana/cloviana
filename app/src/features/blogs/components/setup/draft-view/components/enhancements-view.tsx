import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Label } from '@/components/ui/label';
import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/ui/page';
import { Textarea } from '@/components/ui/textarea';
import { paths } from '@/config/paths';
import { useGenerateBlog } from '@/features/blogs/api/generate-blog';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';

export const EnhancementsView = () => {
  const { push } = useRouter();
  const { blogId, getNextStepEnum } = useDrafter();
  const { data: blog } = useGetBlog({ blogId });
  const { mutateAsync: update, isPending: isSaving } = useUpdateBlog();
  const { mutateAsync: generate, isPending: isGenerating } = useGenerateBlog();

  const [brandVoice, setBrandVoice] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (blog?.brandVoice) setBrandVoice(blog.brandVoice);
  }, [blog?.brandVoice]);

  useEffect(() => {
    if (blog?.additionalInstruction)
      setInstructions(blog.additionalInstruction);
  }, [blog?.additionalInstruction]);

  const trimmedBrandVoice = brandVoice.trim();
  const trimmedInstructions = instructions.trim();

  const nextEnum = getNextStepEnum();

  const save = async () => {
    await update({
      blogId,
      currentStep: nextEnum as BlogSetupStep,
      brandVoice: trimmedBrandVoice || undefined,
      additionalInstruction: trimmedInstructions || undefined,
    });
    await generate({ data: { blogId } });
    push(paths.store.blogs.editor.getHref(blog!.storeId, blogId));
  };

  return (
    <ViewWrapper onNext={save} isNextDisabled={isSaving || isGenerating}>
      <Page>
        <PageHeader>
          <PageTitle>Enhancements</PageTitle>
          <PageParagraph>
            Add optional guidance to shape the blog writer&apos;s tone and
            behavior.
          </PageParagraph>
        </PageHeader>
        <PageContent>
          <div className="grid w-full gap-3">
            <Label htmlFor="brandVoice">Brand Voice</Label>
            <Textarea
              id="brandVoice"
              placeholder="Describe your brand voice (e.g., confident, playful, authoritative, friendly)"
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              rows={6}
              variant="white"
            />
          </div>
          <div className="grid w-full gap-3">
            <Label htmlFor="additionalInstructions">
              Additional Instructions
            </Label>
            <Textarea
              id="additionalInstructions"
              placeholder="Any specific instructions the AI should follow while writing the blog"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              variant="white"
            />
          </div>
        </PageContent>
      </Page>
    </ViewWrapper>
  );
};

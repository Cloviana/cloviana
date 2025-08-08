'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useGetBlog } from '@/api/blogs/get-blog';
import { updateBlogInputSchema, useUpdateBlog } from '@/api/blogs/update-blog';
import { PageActions } from '@/components/actions';
import { TextArea } from '@/components/input';
import { Page } from '@/components/layout';
import { paths } from '@/config/paths';

import { Subtitle, Title } from '../_components/typography';

export const MetaView = () => {
  const { push } = useRouter();
  const { draftId: blogId } = useParams<{
    storeId: string;
    draftId: string;
  }>();
  const { data: blog } = useGetBlog({
    blogId,
    queryConfig: { suspense: true },
  });
  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const [brandVoice, setBrandVoice] = useState('');
  useEffect(() => {
    if (blog?.brandVoice) {
      setBrandVoice(blog.brandVoice);
    }
  }, [blog]);

  const handleUpdate = async () => {
    const validated = updateBlogInputSchema.parse({
      blogId,
      brandVoice,
      generationStep: 'COMPLETE',
    });
    await updateBlog(validated);
    push(paths.editor.getHref(blogId));
  };

  if (!blog) return null;

  return (
    <Page>
      <div className="space-y-5">
        <div className="space-y-1">
          <Title>Describe Your Brand Voice</Title>
          <Subtitle>
            Tell us the tone and style that should guide this blog post.
          </Subtitle>
        </div>
        <TextArea
          label="Brand Voice"
          placeholder="E.g. friendly, informative, and conversational..."
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.currentTarget.value)}
          rows={5}
        />
      </div>
      <PageActions
        primaryAction={{
          children: 'Finish',
          size: 'md',
          loading: isPending,
          onClick: handleUpdate,
        }}
      />
    </Page>
  );
};

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';

import { PageActions } from '@/components/actions';
import { Layout, Page } from '@/components/layout';
import { paths } from '@/config/paths';
import { useCreateBlog } from '@/features/blogs/api/create-blog';

import {
  BlogTypeSelector,
  BrandVoicePicker,
  TitleKeywordForm,
} from './_components';
import { CreateArticleFormValues } from './provider';

export default function NewBlogPage() {
  const { trigger, getValues } = useFormContext<CreateArticleFormValues>();
  const { storeId } = useParams() as { storeId: string };
  const { push } = useRouter();
  const { mutateAsync: createBlog, isPending } = useCreateBlog();

  const handleNext = async () => {
    const valid = await trigger();
    if (!valid) return;

    const values = getValues();
    try {
      const { id } = await createBlog({ storeId, ...values });
      push(paths.editor.getHref(id));
    } catch {
      console.error('Failed to create blog');
    }
  };

  return (
    <Page title="Add blog post">
      <Layout>
        <Layout.Section>
          <BlogTypeSelector />
        </Layout.Section>
        <Layout.Section>
          <TitleKeywordForm />
        </Layout.Section>
        <Layout.Section>
          <BrandVoicePicker />
        </Layout.Section>
      </Layout>
      <PageActions
        primaryAction={{
          content: 'Continue',
          onClick: handleNext,
          loading: isPending,
        }}
      />
    </Page>
  );
}

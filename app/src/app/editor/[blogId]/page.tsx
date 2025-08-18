'use client';

import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { Anchor } from '@/components/actions';
import { LoadingSpinner } from '@/components/animations';
import { paths } from '@/config/paths';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useGetBlogGenerationStatus } from '@/features/blogs/api/get-blog-generation-status';

import { Header, Sidebar, Toolbar } from './_components';
import { Keyword } from './_components/keyword';
import { PublishStatusBadge } from './_components/publish-status-badge';
import { Title } from './_components/title';
import LexicalProvider from './provider';

export default function EditorPage() {
  const { blogId } = useParams() as { blogId: string };

  const { data: blog, refetch: refetchBlog } = useGetBlog(blogId);
  const initialStatus = blog?.generationStatus;

  const { data: blogStatus, isLoading: blogStatusLoading } =
    useGetBlogGenerationStatus(blogId, {
      config: {
        enabled:
          initialStatus && ['IN_PROGRESS', 'QUEUED'].includes(initialStatus),
      },
      pollInterval: 3000,
    });
  const currentStatus = blogStatus?.status;

  useEffect(() => {
    if (initialStatus !== 'READY' && currentStatus && currentStatus === 'READY')
      refetchBlog();
  }, [currentStatus, initialStatus, refetchBlog]);

  if (
    initialStatus !== 'READY' &&
    (blogStatusLoading || (currentStatus && currentStatus !== 'READY'))
  ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size={'xs'} color={'primary'} />
            <span className="text-sm font-medium">Generating blog</span>
          </div>
          <p className="text-center text-sm text-foreground-light">
            It may take a few minutes to generate, you will get an email once
            your blog is ready.
          </p>
          <Anchor
            className="w-fit text-center text-sm text-foreground-light"
            href={paths.store.getHref(blog?.storeId)}
            variant={'subtle'}
          >
            Return back to your store?
          </Anchor>
        </div>
      </div>
    );
  }

  if (!blog?.nodes || !blog.nodes.length) return null;

  return (
    <LexicalProvider nodes={blog?.nodes ?? []}>
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <div className="flex">
          <div className="flex size-10 items-center justify-center border-b border-r">
            <Link href={paths.store.getHref(blog?.storeId)}>
              <img
                src={'/logo-icon.png'}
                alt={'logo'}
                className="size-[18px] object-contain transition-transform hover:rotate-12"
              />
            </Link>
          </div>
          <div className="h-10 flex-1 border-b">
            <Header />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="h-full min-w-10 border-r">
            <Sidebar />
          </div>
          <main className="relative min-h-0 flex-1 overflow-y-auto">
            <Toolbar />
            <div className="relative px-5 py-10">
              <div className="mx-auto max-w-3xl">
                <div className="relative flex flex-col gap-8">
                  <div className="flex w-full flex-col gap-3">
                    <Title />
                    <div className="flex items-center gap-4">
                      <PublishStatusBadge />
                      <Keyword />
                    </div>
                  </div>
                  <hr className="w-full bg-border" />
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable className="prose marker:text-foreground focus:outline-none" />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </LexicalProvider>
  );
}

// app/(...)/editor/page.tsx
'use client';

import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { useGetJob } from '@/api/jobs/get-job';
import { Anchor } from '@/components/deprecated/actions';
import { LoadingSpinner } from '@/components/deprecated/animations';
import { paths } from '@/config/paths';
import { useGetBlog } from '@/features/blogs/_api/get-blog';
import { JobStatus } from '@/types/api';

import { Header, Sidebar, Toolbar } from './_components';
import { Keyword } from './_components/keyword';
import { PublishStatusBadge } from './_components/publish-status-badge';
import { Title } from './_components/title';
import LexicalProvider from './provider';

const ACTIVE: ReadonlyArray<JobStatus> = ['PENDING', 'RUNNING'];

export default function EditorPage() {
  const { blogId } = useParams() as { blogId: string };

  const { data: blog, refetch: refetchBlog } = useGetBlog(blogId);
  const storeId = blog?.storeId ?? '';
  const jobId = blog?.job?.id ?? '';
  const initialJobStatus = blog?.job?.status as JobStatus | undefined;

  const enabled = useMemo(
    () =>
      Boolean(
        storeId &&
          jobId &&
          initialJobStatus &&
          ACTIVE.includes(initialJobStatus),
      ),
    [storeId, jobId, initialJobStatus],
  );

  const { data: job } = useGetJob(storeId, jobId, {
    queryConfig: {
      enabled,
      refetchInterval: (q) =>
        q.state.data && ACTIVE.includes(q.state.data.status as JobStatus)
          ? 3000
          : false,
      staleTime: 15_000,
    },
  });

  const currentStatus = (job?.status ?? initialJobStatus) as
    | JobStatus
    | undefined;

  useEffect(() => {
    if (!initialJobStatus) return;
    if (initialJobStatus !== 'SUCCESS' && currentStatus === 'SUCCESS')
      refetchBlog();
  }, [currentStatus, initialJobStatus, refetchBlog]);

  if (
    ACTIVE.includes(currentStatus as JobStatus) &&
    (!blog?.nodes || blog.nodes.length === 0)
  ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="xs" color="primary" />
            <span className="text-sm font-medium">Generating blog</span>
          </div>
          <p className="text-foreground-light text-center text-sm">
            It may take a few minutes to generate, you will get an email once
            your blog is ready.
          </p>
          <Anchor
            className="text-foreground-light w-fit text-center text-sm"
            href={paths.store.getHref(storeId)}
            variant="subtle"
          >
            Return back to your store?
          </Anchor>
        </div>
      </div>
    );
  }

  if (!blog?.nodes || !blog.nodes.length) return null;

  return (
    <LexicalProvider nodes={blog.nodes}>
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <div className="flex">
          <div className="flex size-10 items-center justify-center border-r border-b">
            <Link href={paths.store.getHref(storeId)}>
              <img
                src="/logo-icon.png"
                alt="logo"
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
                  <hr className="bg-border w-full" />
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable className="prose marker:text-foreground focus:outline-hidden" />
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

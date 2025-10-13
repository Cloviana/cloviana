'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useGetBlog } from '@/api/blogs/get-blog';
import { LoadingSpinner } from '@/components/deprecated/animations';
import { GenerationStep } from '@/types/api';

import { Header } from './_components/header';
import { Sidebar } from './_components/sidebar';
import { KeywordView, MetaView, TopicView } from './_views';
import { TitleView } from './_views/title-view';

export default function StepPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const { data: blog } = useGetBlog({
    blogId: draftId,
  });

  const viewMap: Partial<Record<GenerationStep, any>> = {
    TOPIC: <TopicView />,
    KEYWORD: <KeywordView />,
    TITLE: <TitleView />,
    META: <MetaView />,
  };

  if (!blog) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <div className="flex h-[52px] shrink-0 border-b bg-gray-50">
        <Header />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden min-h-0 w-[450px] border-r md:flex">
          <Sidebar />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex size-full items-center justify-center">
                <LoadingSpinner size={'sm'} color={'base'} />
              </div>
            }
          >
            <ErrorBoundary fallback={''}>
              {viewMap[blog.generationStep ?? 'TOPIC']}
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

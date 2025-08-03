'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Header } from './_components/header';
import { Sidebar } from './_components/sidebar';
import { TopicView } from './_views/topic-view';

export default function StepPage() {
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
          <Suspense fallback={''}>
            <ErrorBoundary fallback={''}>
              <TopicView />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

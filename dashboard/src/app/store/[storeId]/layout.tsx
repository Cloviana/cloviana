import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { LoadingSpinner } from '@/components/animations';
import { paths } from '@/config/paths';
import { getStoreQueryOptions } from '@/features/stores/api/get-store';

import { Header } from './_components/header';
import { Sidebar } from './_components/sidebar';

interface LayoutProps {
  children: ReactNode;
  params: { storeId: string };
}

export default async function Layout({ children, params }: LayoutProps) {
  const { storeId } = params;
  const qc = new QueryClient();
  const store = await qc.ensureQueryData(getStoreQueryOptions(storeId));

  if (store.status === 'DRAFT') {
    redirect(paths.store.getHref());
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        <div className="flex h-11 shrink-0 border-b">
          <Header />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden min-h-0 w-60 border-r md:flex">
            <Sidebar />
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <div className="flex size-full items-center justify-center">
                  <LoadingSpinner size={'sm'} color={'light'} />
                </div>
              }
            >
              <ErrorBoundary
                fallback={
                  <div className="flex size-full items-center justify-center">
                    <p className="text-sm text-foreground">
                      Something went wrong, please refresh the page or contact
                      support at{' '}
                      <a
                        className="underline"
                        href="mailto:support@cloviana.com"
                      >
                        support@cloviana.com
                      </a>
                      .
                    </p>
                  </div>
                }
              >
                {children}
              </ErrorBoundary>
            </Suspense>
          </main>
        </div>
      </div>
    </HydrationBoundary>
  );
}

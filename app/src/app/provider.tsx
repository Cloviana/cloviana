'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import dynamic from 'next/dynamic';
import * as React from 'react';

import { queryConfig } from '@/lib/react-query';

const MSWProvider =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/mocks/msw-provider').then((m) => m.MSWProvider), {
        ssr: false,
      })
    : () => null;

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MSWProvider />
      {process.env.DEV && <ReactQueryDevtools />}
      {children}
    </QueryClientProvider>
  );
};

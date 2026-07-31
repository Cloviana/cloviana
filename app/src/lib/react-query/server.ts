import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

import { queryConfig } from './client';

// One QueryClient per server request (React cache), sharing the client-side
// defaults so prefetched data hydrates with the same staleTime instead of
// being refetched immediately on mount.
export const getQueryClient = cache(
  () => new QueryClient({ defaultOptions: queryConfig }),
);

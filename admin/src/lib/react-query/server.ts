import 'server-only';

import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

import { queryConfig } from './client';

export const getQueryClient = cache(
  () => new QueryClient({ defaultOptions: queryConfig }),
);

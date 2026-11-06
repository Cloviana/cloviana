import 'server-only';

import { cache } from 'react';

import { api } from '@/lib/api/api-client';

import type { Me } from '../types/me';

// cache() dedupes the call between a layout and its pages within one request.
export const getMe = cache(() => api.get<Me>('/me'));

import 'server-only';
import { api } from '@/lib/api/api-client';

import type { FileListParams, FilePage } from '../types/file';
export function listFiles(slug: string, params: FileListParams = {}) {
  return api.get<FilePage>(`/marketplaces/${encodeURIComponent(slug)}/files`, {
    params: { ...params },
  });
}

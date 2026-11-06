import 'server-only';
import { api } from '@/lib/api/api-client';

import type {
  CompleteFileUpload,
  FileAsset,
  PrepareFileUpload,
  PreparedFileUpload,
} from '../types/file';
export function prepareFileUpload(slug: string, input: PrepareFileUpload) {
  return api.post<PreparedFileUpload>(
    `/marketplaces/${encodeURIComponent(slug)}/files/uploads`,
    input,
  );
}
export function completeFileUpload(slug: string, input: CompleteFileUpload) {
  return api.post<FileAsset>(
    `/marketplaces/${encodeURIComponent(slug)}/files/uploads/complete`,
    input,
  );
}

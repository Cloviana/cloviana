import 'server-only';

import { api } from '@/lib/api/api-client';

import type { EditorState } from '../types';

export function getEditorState(slug: string, themeId: string) {
  return api.get<EditorState>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor`,
  );
}

import { queryOptions } from '@tanstack/react-query';

import { paths } from '@/config/paths';

import { getActiveRunAction } from './actions/get-active-run';
import { getEditorStateAction } from './actions/get-editor-state';
import { getPreviewAction } from './actions/get-preview';
import { getSourceFileAction } from './actions/get-source-file';
import { listChangesAction } from './actions/list-changes';
import { listConversationsAction } from './actions/list-conversations';
import { listMessagesAction } from './actions/list-messages';
import { listRevisionsAction } from './actions/list-revisions';
import type { SourceFile } from './types';

export const editorKeys = {
  all: (slug: string, themeId: string) =>
    ['theme-editor', slug, themeId] as const,
  state: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'state'] as const,
  preview: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'preview'] as const,
  files: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'files'] as const,
  revisions: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'revisions'] as const,
  conversations: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'conversations'] as const,
  messages: (slug: string, themeId: string, conversationId: string) =>
    [...editorKeys.conversations(slug, themeId), conversationId] as const,
  activeRun: (slug: string, themeId: string, conversationId: string) =>
    [...editorKeys.messages(slug, themeId, conversationId), 'run'] as const,
};

export const editorStateQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: editorKeys.state(slug, themeId),
    queryFn: () => getEditorStateAction(slug, themeId),
  });

export const previewQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: editorKeys.preview(slug, themeId),
    queryFn: () => getPreviewAction(slug, themeId),
  });

async function readSource(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response;
}

/** A revision's file list and a file's bytes never change, so one fetch lasts the session. */
export const revisionFilesQueryOptions = (
  slug: string,
  themeId: string,
  revisionId: string,
) =>
  queryOptions({
    queryKey: [...editorKeys.files(slug, themeId), 'revision', revisionId],
    queryFn: async (): Promise<SourceFile[]> =>
      (
        await readSource(
          `${paths.mp.themes.editor.getHref(slug, themeId)}/source/revisions/${encodeURIComponent(revisionId)}`,
        )
      ).json(),
    staleTime: Infinity,
  });

export const storedFileQueryOptions = (
  slug: string,
  themeId: string,
  sha256: string,
) =>
  queryOptions({
    queryKey: [...editorKeys.files(slug, themeId), 'blob', sha256],
    queryFn: async () =>
      (
        await readSource(
          `${paths.mp.themes.editor.getHref(slug, themeId)}/source/blobs/${sha256}`,
        )
      ).text(),
    staleTime: Infinity,
  });

export const liveChangesQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: [...editorKeys.files(slug, themeId), 'changes'],
    queryFn: () => listChangesAction(slug, themeId),
  });

export const liveFileQueryOptions = (
  slug: string,
  themeId: string,
  path: string,
) =>
  queryOptions({
    queryKey: [...editorKeys.files(slug, themeId), 'live', path],
    queryFn: () => getSourceFileAction(slug, themeId, path),
  });

export const revisionsQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: editorKeys.revisions(slug, themeId),
    queryFn: () => listRevisionsAction(slug, themeId),
  });

export const conversationsQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: editorKeys.conversations(slug, themeId),
    queryFn: () => listConversationsAction(slug, themeId),
  });

export const messagesQueryOptions = (
  slug: string,
  themeId: string,
  conversationId: string,
) =>
  queryOptions({
    queryKey: editorKeys.messages(slug, themeId, conversationId),
    queryFn: () => listMessagesAction(slug, conversationId),
  });

export const activeRunQueryOptions = (
  slug: string,
  themeId: string,
  conversationId: string,
) =>
  queryOptions({
    queryKey: editorKeys.activeRun(slug, themeId, conversationId),
    queryFn: () => getActiveRunAction(slug, conversationId),
  });

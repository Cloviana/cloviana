import { queryOptions } from '@tanstack/react-query';

import { getActiveRunAction } from './actions/get-active-run';
import { getEditorStateAction } from './actions/get-editor-state';
import { getPreviewAction } from './actions/get-preview';
import { getSourceFileAction } from './actions/get-source-file';
import { listConversationsAction } from './actions/list-conversations';
import { listMessagesAction } from './actions/list-messages';
import { listRevisionsAction } from './actions/list-revisions';
import { listSourceFilesAction } from './actions/list-source-files';

export const editorKeys = {
  all: (slug: string, themeId: string) =>
    ['theme-editor', slug, themeId] as const,
  state: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'state'] as const,
  preview: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'preview'] as const,
  files: (slug: string, themeId: string) =>
    [...editorKeys.all(slug, themeId), 'files'] as const,
  file: (slug: string, themeId: string, path: string) =>
    [...editorKeys.files(slug, themeId), path] as const,
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

export const sourceFilesQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: editorKeys.files(slug, themeId),
    queryFn: () => listSourceFilesAction(slug, themeId),
  });

export const sourceFileQueryOptions = (
  slug: string,
  themeId: string,
  path: string,
) =>
  queryOptions({
    queryKey: editorKeys.file(slug, themeId, path),
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

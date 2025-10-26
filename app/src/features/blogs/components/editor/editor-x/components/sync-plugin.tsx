'use client';

import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalEditor, type EditorState } from 'lexical';
import debounce from 'lodash.debounce';
import { useParams } from 'next/navigation';
import { useCallback, useRef } from 'react';

import { useSyncNodes } from '@/features/blogs/api/sync-nodes';

type EditorStateJSON = ReturnType<EditorState['toJSON']>;

export function SyncPlugin() {
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();
  const { mutate: syncNodes } = useSyncNodes();

  const buildAndSync = useCallback(
    (editor: LexicalEditor) => {
      const state: EditorStateJSON = editor.getEditorState().toJSON();
      syncNodes({ blogId, storeId, state });
    },
    [blogId, syncNodes, storeId],
  );

  const debouncedSync = useRef(debounce(buildAndSync, 1000)).current;

  return (
    <OnChangePlugin
      ignoreHistoryMergeTagChange
      ignoreSelectionChange
      onChange={(_, editor, tags) => {
        if (tags.has('init')) return;
        debouncedSync(editor);
      }}
    />
  );
}

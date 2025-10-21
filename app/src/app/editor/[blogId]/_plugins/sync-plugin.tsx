'use client';

import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, $isElementNode, LexicalEditor, LexicalNode } from 'lexical';
import debounce from 'lodash.debounce';
import { useParams } from 'next/navigation';
import { useCallback, useRef } from 'react';

import { useSyncNodes } from '@/features/blogs/_api/sync-nodes';
import { Node } from '@/types/api';

import { fromLexicalNode } from '../_utils/from-lexical-node';

export function SyncPlugin() {
  const { blogId } = useParams<{ blogId: string }>();

  const { mutate: syncNodes } = useSyncNodes();

  const buildAndSync = useCallback(
    (editor: LexicalEditor) => {
      const nodes: Node[] = [];

      editor.getEditorState().read(() => {
        const root = $getRoot();

        function traverse(node: LexicalNode) {
          nodes.push(fromLexicalNode(node));

          if ($isElementNode(node)) {
            node.getChildren().forEach((child) => traverse(child));
          }
        }

        root.getChildren().forEach((child) => traverse(child));
      });
      syncNodes({ blogId, nodes });
    },
    [blogId, syncNodes],
  );

  const debouncedSync = useRef(debounce(buildAndSync, 1_000)).current;

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

/*
  const changed = useRef<Map<string, LexicalNode>>(new Map());
  const deleted = useRef<Map<string, LexicalNode>>(new Map());

  const { mutateAsync: updateNodeAsync } = useUpdateNode();
  const { mutateAsync: deleteNodeAsync } = useDeleteNode();

  const flush = async () => {
    if (!initialized.current) return;
    const toUpdate = Array.from(changed.current.values());
    const toDelete = Array.from(deleted.current.values());
    if (toUpdate.length === 0 && toDelete.length === 0) return;

    changed.current.clear();
    deleted.current.clear();

    const promises: Promise<unknown>[] = [];
    
    editor.getEditorState().read(() => {
      for (const node of toUpdate) {
        promises.push(updateNodeAsync({ blogId, ...fromLexicalNode(node) }));
      }

      for (const node of toDelete) {
        const key = (node as any).__id
        if(key) promises.push(deleteNodeAsync({ blogId, key }));
      }
    });

    await Promise.all(promises);
    
  };

  const debouncedFlush = useRef(debounce(flush, 1000)).current;

  useEffect(() => {
    const removeInit = editor.registerUpdateListener(({ tags }) => {
      if (tags.has('init')) initialized.current = true;
    });

    const nodeClasses = [
      ExtendedHeadingNode,
      ExtendedParagraphNode,
      ExtendedListNode,
      ExtendedListItemNode,
      ExtendedTextNode,
    ];

    const removers = nodeClasses.map((NodeClass) =>
      editor.registerMutationListener(
        NodeClass,
        (mutations, { prevEditorState }) => {
          if (!initialized.current) return;

          prevEditorState.read(() => {
            mutations.forEach((mutation, key) => {
              if (mutation === 'destroyed') {
                const prevNode = $getNodeByKey(key);
                if (prevNode) {
                  deleted.current.set(key, prevNode);
                  changed.current.delete(key);
                }
              }
            });
          });

          editor.getEditorState().read(() => {
            mutations.forEach((mutation, key) => {
              if (mutation !== 'destroyed') {
                const node = $getNodeByKey(key);
                if (node) {
                  changed.current.set(key, node);
                  deleted.current.delete(key);
                }
              }
            });
          });

          debouncedFlush();
        },
        { skipInitialization: true },
      ),
    );

    return () => {
      removeInit();
      removers.forEach((r) => r());
      debouncedFlush.cancel();
    };
  }, [editor, debouncedFlush]);
  */

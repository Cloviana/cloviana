'use client';

import { ListNode, ListItemNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HeadingNode } from '@lexical/rich-text';
import { TextNode, ParagraphNode } from 'lexical';
import { ReactNode } from 'react';

import { Node } from '@/types/api';

import { InitialContentPlugin } from './_plugins/initial-content-plugin';
import { SyncPlugin } from './_plugins/sync-plugin';
import {
  $createExtendedHeadingNode,
  $createExtendedListItemNode,
  $createExtendedListNode,
  $createExtendedParagraphNode,
  $createExtendedTextNode,
  ExtendedHeadingNode,
  ExtendedListItemNode,
  ExtendedListNode,
  ExtendedParagraphNode,
  ExtendedTextNode,
} from './_utils/extended-nodes';

interface LexicalProviderProps {
  nodes: Node[];
  children: ReactNode;
}

const theme = {
  text: {
    underline: 'underline',
    bold: 'font-bold',
    italic: 'italic',
    strikethrough: 'line-through',
  },
};

export default function LexicalProvider({
  nodes,
  children,
}: LexicalProviderProps) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'editor',
        theme,
        onError: (error) => {
          throw error;
        },
        nodes: [
          ExtendedHeadingNode,
          ExtendedParagraphNode,
          ExtendedTextNode,
          ExtendedListItemNode,
          ExtendedListNode,
          {
            replace: TextNode,
            withKlass: ExtendedTextNode,
            with: (node: TextNode) =>
              $createExtendedTextNode(node.getTextContent()),
          },
          {
            replace: ListNode,
            withKlass: ExtendedListNode,
            with: (node: ListNode) =>
              $createExtendedListNode(node.getListType()),
          },
          {
            replace: ListItemNode,
            withKlass: ExtendedListItemNode,
            with: (node: ListItemNode) =>
              $createExtendedListItemNode(node.getValue()),
          },
          {
            replace: ParagraphNode,
            withKlass: ExtendedParagraphNode,
            with: () => $createExtendedParagraphNode(),
          },
          {
            replace: HeadingNode,
            withKlass: ExtendedHeadingNode,
            with: (node: HeadingNode) =>
              $createExtendedHeadingNode(node.getTag()),
          },
        ],
      }}
    >
      <InitialContentPlugin nodes={nodes} />
      <HistoryPlugin />
      <ListPlugin />
      <SyncPlugin />
      {children}
    </LexicalComposer>
  );
}

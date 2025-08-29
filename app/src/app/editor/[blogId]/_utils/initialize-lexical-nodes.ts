import { $getRoot, ElementNode, LexicalEditor, LexicalNode } from 'lexical';

import { Node } from '@/types/api';

import {
  $createExtendedHeadingNode,
  $createExtendedListItemNode,
  $createExtendedListNode,
  $createExtendedParagraphNode,
  $createExtendedTextNode,
  ExtendedTextNode,
} from './extended-nodes';

export const initializeLexicalNodes = (
  nodes: Node[],
  editor: LexicalEditor,
) => {
  editor.update(
    () => {
      const root = $getRoot();

      root.clear();

      const rootChildren = nodes.reduce(
        (acc, node) => {
          const key = node.parentKey ?? 'root';
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(node);
          return acc;
        },
        {} as Record<string, Node[]>,
      );

      transverse(root, 'root', rootChildren);
    },
    { tag: 'init' },
  );
};

const transverse = (
  parent: ElementNode,
  parentKey: string,
  map: Record<string, Node[]>,
) => {
  const kids = map[parentKey] ?? [];
  kids.sort((a, b) => a.sortOrder - b.sortOrder);

  for (const [i, k] of kids.entries()) {
    let lexNode: LexicalNode | null = null;

    switch (k.type) {
      case 'HEADING':
        lexNode = $createExtendedHeadingNode(k.payload.tag, k.key);
        break;

      case 'TEXT': {
        const textNode = $createExtendedTextNode(
          k.payload.text,
        ) as ExtendedTextNode;

        textNode.setFormat(k.payload.format);

        lexNode = textNode;
        break;
      }

      case 'PARAGRAPH': {
        lexNode = $createExtendedParagraphNode(k.key);
        break;
      }

      case 'LIST': {
        lexNode = $createExtendedListNode(k.payload.listType, k.key);
        break;
      }

      case 'LIST_ITEM': {
        lexNode = $createExtendedListItemNode(i + 1, k.key);
        break;
      }

      default:
        continue;
    }

    if (!lexNode) continue;

    parent.append(lexNode);

    if (lexNode instanceof ElementNode) {
      transverse(lexNode, k.key, map);
    }
  }
};

import { LexicalNode } from 'lexical';

import { Node } from '@/types/api';

import {
  $isExtendedHeadingNode,
  $isExtendedListItemNode,
  $isExtendedListNode,
  $isExtendedParagraphNode,
  $isExtendedTextNode,
  ExtendedHeadingNode,
  ExtendedListItemNode,
  ExtendedListNode,
  ExtendedParagraphNode,
  ExtendedTextNode,
} from './extended-nodes';

export function fromLexicalNode(node: LexicalNode): Node {
  switch (node.getType()) {
    case 'extended-paragraph': {
      if ($isExtendedParagraphNode(node)) {
        const paragraph = node as ExtendedParagraphNode;
        const lexJson = paragraph.exportJSON();
        const sortOrder = paragraph.getIndexWithinParent();
        return {
          key: lexJson.id,
          type: 'PARAGRAPH',
          sortOrder,
          payload: {},
        };
      }
      break;
    }

    case 'extended-text': {
      if ($isExtendedTextNode(node)) {
        const text = node as ExtendedTextNode;
        const lexJson = text.exportJSON();
        const sortOrder = text.getIndexWithinParent();
        const parentKey = text.getParentId();
        return {
          key: lexJson.id,
          type: 'TEXT',
          parentKey,
          sortOrder,
          payload: {
            text: text.getTextContent(),
            format: text.getFormat(),
          },
        };
      }
      break;
    }

    case 'extended-list': {
      if ($isExtendedListNode(node)) {
        const list = node as ExtendedListNode;
        const lexJson = list.exportJSON();
        const sortOrder = list.getIndexWithinParent();
        const listType = lexJson.listType;
        return {
          key: lexJson.id,
          type: 'LIST',
          sortOrder,
          payload: {
            listType,
          },
        };
      }
      break;
    }

    case 'extended-list-item': {
      if ($isExtendedListItemNode(node)) {
        const listItem = node as ExtendedListItemNode;
        const lexJson = listItem.exportJSON();
        const sortOrder = listItem.getIndexWithinParent();
        const parentKey = listItem.getParentId();
        return {
          key: lexJson.id,
          type: 'LIST_ITEM',
          parentKey,
          sortOrder,
          payload: {},
        };
      }
      break;
    }

    case 'extended-heading': {
      if ($isExtendedHeadingNode(node)) {
        const heading = node as ExtendedHeadingNode;
        const lexJson = heading.exportJSON();
        const sortOrder = heading.getIndexWithinParent();
        const tag = heading.getTag();
        return {
          key: lexJson.id,
          type: 'HEADING',
          sortOrder,
          payload: {
            tag,
          },
        };
      }
      break;
    }
  }
  throw new Error(`Unsupported node type: ${node.getType()}`);
}

import { LexicalNode } from 'lexical';

import { InlineStyles, Node } from '@/types/api';

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

export function formatToStyles(format: number = 0): InlineStyles {
  const styles: InlineStyles = {};

  if (format & 1) styles.bold = true;
  if (format & 2) styles.italic = true;
  if (format & 4) styles.underline = true;
  if (format & 8) styles.strikethrough = true;
  if (format & 16) styles.code = true;
  if (format & 32) styles.subscript = true;
  if (format & 64) styles.superscript = true;

  return styles;
}

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
          payload: {
            indent: lexJson.indent,
          },
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
            styles: formatToStyles(text.getFormat()),
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
        const style = lexJson.listType === 'number' ? 'ordered' : 'unordered';
        return {
          key: lexJson.id,
          type: 'LIST',
          sortOrder,
          payload: {
            style,
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
        let level: 2 | 3;
        if (tag === 'h2') level = 2;
        else if (tag === 'h3') level = 3;
        else level = 2;
        return {
          key: lexJson.id,
          type: 'HEADING',
          sortOrder,
          payload: {
            level,
          },
        };
      }
      break;
    }
  }
  throw new Error(`Unsupported node type: ${node.getType()}`);
}

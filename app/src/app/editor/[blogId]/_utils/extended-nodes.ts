import {
  ListItemNode,
  ListNode,
  ListType,
  SerializedListItemNode,
  SerializedListNode,
} from '@lexical/list';
import {
  HeadingNode,
  HeadingTagType,
  SerializedHeadingNode,
} from '@lexical/rich-text';
import {
  $applyNodeReplacement,
  NodeKey,
  TextNode,
  SerializedTextNode,
  LexicalNode,
  SerializedParagraphNode,
  ParagraphNode,
} from 'lexical';

import { newId } from './id';

/**
 * EXTENDED TEXT NODE
 */

export type SerializedExtendedTextNode = SerializedTextNode & {
  id: string;
  type: 'extended-text';
};

export class ExtendedTextNode extends TextNode {
  __id: string;

  constructor(text: string, id?: string, key?: NodeKey) {
    super(text, key);
    this.__id = id ?? newId();
  }

  static getType(): string {
    return 'extended-text';
  }

  static clone(node: ExtendedTextNode): ExtendedTextNode {
    return $applyNodeReplacement(
      new ExtendedTextNode(node.getTextContent(), node.__id, node.getKey()),
    );
  }

  static importJSON(
    serializedNode: SerializedExtendedTextNode,
  ): ExtendedTextNode {
    const { text, format, detail, mode, style, id } = serializedNode;

    const node = $applyNodeReplacement(new ExtendedTextNode(text, id));

    node.setFormat(format);
    node.setDetail(detail);
    node.setMode(mode as any);
    node.setStyle(style);

    return node;
  }

  exportJSON(): SerializedExtendedTextNode {
    const json = super.exportJSON() as SerializedTextNode;
    return {
      ...json,
      id: this.__id,
      type: 'extended-text',
    };
  }

  getParentId(): string | null {
    const parent = this.getParent();

    if (parent && $isExtendedParagraphNode(parent)) {
      return parent.exportJSON().id;
    } else if (parent && $isExtendedListItemNode(parent)) {
      return parent.exportJSON().id;
    } else if (parent && $isExtendedHeadingNode(parent)) {
      return parent.exportJSON().id;
    }

    return null;
  }
}

export function $createExtendedTextNode(
  text: string,
  id?: string,
): ExtendedTextNode {
  return $applyNodeReplacement(new ExtendedTextNode(text, id));
}

export function $isExtendedTextNode(
  node: LexicalNode | null | undefined,
): node is ExtendedTextNode {
  return node instanceof ExtendedTextNode;
}

/**
 * EXTENDED LIST NODE
 */
export type SerializedExtendedListNode = SerializedListNode & {
  id: string;
  type: 'extended-list';
};

export class ExtendedListNode extends ListNode {
  __id: string;

  constructor(listType: ListType, id?: string, key?: NodeKey) {
    super(listType, undefined, key);
    this.__id = id ?? newId();
  }

  static getType(): string {
    return 'extended-list';
  }

  static clone(node: ExtendedListNode): ExtendedListNode {
    return $applyNodeReplacement(
      new ExtendedListNode(node.getListType(), node.__id, node.getKey()),
    );
  }

  exportJSON(): SerializedExtendedListNode {
    const json = super.exportJSON() as SerializedListNode;
    return {
      ...json,
      id: this.__id,
      type: 'extended-list',
    };
  }

  static importJSON(serialized: SerializedExtendedListNode): ExtendedListNode {
    const { listType, indent, id } = serialized;
    const node = $applyNodeReplacement(new ExtendedListNode(listType, id));
    node.setIndent(indent);
    return node;
  }
}

export function $createExtendedListNode(
  listType: ListType,
  id?: string,
): ExtendedListNode {
  return $applyNodeReplacement(new ExtendedListNode(listType, id));
}

export function $isExtendedListNode(
  node: LexicalNode | null | undefined,
): node is ExtendedListNode {
  return node instanceof ExtendedListNode;
}

/**
 * EXTENDED LIST ITEM
 */
export type SerializedExtendedListItemNode = SerializedListItemNode & {
  id: string;
  type: 'extended-list-item';
};

export class ExtendedListItemNode extends ListItemNode {
  __id: string;

  constructor(value?: number, id?: string, key?: NodeKey) {
    super(value, undefined, key);
    this.__id = id ?? newId();
  }

  static getType(): string {
    return 'extended-list-item';
  }

  static clone(node: ExtendedListItemNode): ExtendedListItemNode {
    const clone = new ExtendedListItemNode(
      node.getValue(),
      node.__id,
      node.getKey(),
    );
    return $applyNodeReplacement(clone);
  }

  exportJSON(): SerializedExtendedListItemNode {
    const json = super.exportJSON() as SerializedListItemNode;
    return {
      ...json,
      id: this.__id,
      type: 'extended-list-item',
    };
  }

  static importJSON(
    serialized: SerializedExtendedListItemNode,
  ): ExtendedListItemNode {
    const { indent, id, value } = serialized;
    const node = $applyNodeReplacement(new ExtendedListItemNode(value, id));
    node.setIndent(indent);
    return node;
  }

  getParentId(): string | null {
    const parent = this.getParent();

    if (parent && $isExtendedListNode(parent)) {
      return parent.exportJSON().id;
    }

    return null;
  }
}

export function $createExtendedListItemNode(
  value?: number,
  id?: string,
): ExtendedListItemNode {
  return $applyNodeReplacement(new ExtendedListItemNode(value, id));
}

export function $isExtendedListItemNode(
  node: LexicalNode | null | undefined,
): node is ExtendedListItemNode {
  return node instanceof ExtendedListItemNode;
}

/**
 * EXTENDED PARAGRAPH NODE
 */
export type SerializedExtendedParagraphNode = SerializedParagraphNode & {
  id: string;
  type: 'extended-paragraph';
};

export class ExtendedParagraphNode extends ParagraphNode {
  __id: string;

  constructor(id?: string, key?: NodeKey) {
    super(key);
    this.__id = id ?? newId();
  }

  static getType(): string {
    return 'extended-paragraph';
  }

  static clone(node: ExtendedParagraphNode): ExtendedParagraphNode {
    return $applyNodeReplacement(
      new ExtendedParagraphNode(node.__id, node.getKey()),
    );
  }

  exportJSON(): SerializedExtendedParagraphNode {
    const json = super.exportJSON() as SerializedParagraphNode;
    return {
      ...json,
      id: this.__id,
      type: 'extended-paragraph',
    };
  }

  static importJSON(
    serialized: SerializedExtendedParagraphNode,
  ): ExtendedParagraphNode {
    const { indent, id } = serialized;
    const node = $applyNodeReplacement(new ExtendedParagraphNode(id));
    node.setIndent(indent);
    return node;
  }
}

export function $createExtendedParagraphNode(
  id?: string,
): ExtendedParagraphNode {
  return $applyNodeReplacement(new ExtendedParagraphNode(id));
}

export function $isExtendedParagraphNode(
  node: LexicalNode | null | undefined,
): node is ExtendedParagraphNode {
  return node instanceof ExtendedParagraphNode;
}

/**
 * EXTENDED HEADING NODE
 */
export type SerializedExtendedHeadingNode = SerializedHeadingNode & {
  id: string;
  type: 'extended-heading';
};

export class ExtendedHeadingNode extends HeadingNode {
  __id: string;

  constructor(tag: HeadingTagType, id?: string, key?: NodeKey) {
    super(tag, key);
    this.__id = id ?? newId();
  }

  static getType(): string {
    return 'extended-heading';
  }

  static clone(node: ExtendedHeadingNode): ExtendedHeadingNode {
    return $applyNodeReplacement(
      new ExtendedHeadingNode(node.getTag(), node.__id, node.getKey()),
    );
  }

  exportJSON(): SerializedExtendedHeadingNode {
    const json = super.exportJSON() as SerializedHeadingNode;
    return {
      ...json,
      id: this.__id,
      type: 'extended-heading',
    };
  }

  static importJSON(
    serialized: SerializedExtendedHeadingNode,
  ): ExtendedHeadingNode {
    const { tag, indent, id } = serialized;
    const node = $applyNodeReplacement(new ExtendedHeadingNode(tag, id));
    node.setIndent(indent);
    return node;
  }
}

export function $createExtendedHeadingNode(
  tag: HeadingTagType,
  id?: string,
): ExtendedHeadingNode {
  return $applyNodeReplacement(new ExtendedHeadingNode(tag, id));
}

export function $isExtendedHeadingNode(
  node: LexicalNode | null | undefined,
): node is ExtendedHeadingNode {
  return node instanceof ExtendedHeadingNode;
}

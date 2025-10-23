import { SerializedEditorState } from 'lexical';

import { Node } from '@/types/api';

type LexicalNode =
  | {
      type: 'text';
      detail: number;
      format: number;
      mode: 'normal';
      style: string;
      text: string;
      version: 1;
    }
  | {
      type: 'paragraph';
      children: LexicalNode[];
      direction: 'ltr';
      format: '';
      indent: 0;
      version: 1;
    }
  | {
      type: 'heading';
      tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      children: LexicalNode[];
      direction: 'ltr';
      format: '';
      indent: 0;
      version: 1;
    }
  | {
      type: 'list';
      listType: 'bullet' | 'number' | 'check';
      tag: 'ul' | 'ol';
      start: number;
      children: LexicalNode[];
      direction: 'ltr';
      format: '';
      indent: 0;
      version: 1;
    }
  | {
      type: 'listitem';
      value?: number;
      checked?: boolean;
      children: LexicalNode[];
      direction: 'ltr';
      format: '';
      indent: 0;
      version: 1;
    }
  | {
      type: 'link';
      url: string;
      rel: string | null;
      target: string | null;
      title: string | null;
      children: LexicalNode[];
      direction: 'ltr';
      format: '';
      indent: 0;
      version: 1;
    }
  | {
      type: 'quote';
      children: LexicalNode[];
      direction: 'ltr';
      format: '';
      indent: 0;
      version: 1;
    }
  | {
      type: 'linebreak';
      version: 1;
    };

export function nodesToLexicalState(nodes: Node[]): SerializedEditorState {
  const byParent: Record<string, Node[]> = {};
  for (const n of nodes) {
    const pk = n.parentKey ?? 'root';
    if (!byParent[pk]) byParent[pk] = [];
    byParent[pk].push(n);
  }

  const build = (parentKey: string): LexicalNode[] => {
    const kids = (byParent[parentKey] ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const out: LexicalNode[] = [];

    for (let i = 0; i < kids.length; i++) {
      const k = kids[i]!;
      let node: LexicalNode | null = null;

      if (k.type === 'TEXT') {
        node = {
          type: 'text',
          detail: 0,
          format: k.payload.format,
          mode: 'normal',
          style: '',
          text: k.payload.text,
          version: 1,
        };
        out.push(node);
        continue;
      }

      if (k.type === 'PARAGRAPH') {
        node = {
          type: 'paragraph',
          children: build(k.key),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        };
      } else if (k.type === 'HEADING') {
        node = {
          type: 'heading',
          tag: k.payload.tag,
          children: build(k.key),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        };
      } else if (k.type === 'LIST') {
        const tag = k.payload.listType === 'number' ? 'ol' : 'ul';
        node = {
          type: 'list',
          listType: k.payload.listType,
          tag,
          start: 1,
          children: build(k.key),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        };
      } else if (k.type === 'LIST_ITEM') {
        const children = build(k.key);
        const li: LexicalNode = {
          type: 'listitem',
          value: undefined,
          checked: undefined,
          children,
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        };
        const parent = nodes.find((n) => n.key === k.parentKey);
        if (parent && parent.type === 'LIST') {
          if (parent.payload.listType === 'number') (li as any).value = i + 1;
          if (parent.payload.listType === 'check') (li as any).checked = false;
        }
        node = li;
      } else if (k.type === 'LINK') {
        const url = (k as any).payload?.href ?? (k as any).payload?.url ?? '';
        const title = (k as any).payload?.title ?? null;
        node = {
          type: 'link',
          url,
          rel: null,
          target: null,
          title,
          children: build(k.key),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        };
      } else if (k.type === 'QUOTE') {
        node = {
          type: 'quote',
          children: build(k.key),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        };
      } else if (k.type === 'LINEBREAK') {
        node = {
          type: 'linebreak',
          version: 1,
        };
      }

      if (node) out.push(node);
    }

    return out;
  };

  const rootChildren = build('root');

  return {
    root: {
      children: rootChildren,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as unknown as SerializedEditorState;
}

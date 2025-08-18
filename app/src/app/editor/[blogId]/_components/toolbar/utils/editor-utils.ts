import {
  $createListNode,
  $createListItemNode,
  $isListNode,
} from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from 'lexical';

/**
 * Change every block in the current selection to a paragraph or heading.
 *
 * @param editor  The LexicalEditor instance
 * @param blockType  'paragraph' | 'h2' | 'h3'
 */
export function applyBlockType(
  editor: LexicalEditor,
  blockType: 'paragraph' | 'h2' | 'h3',
): void {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    if (blockType === 'paragraph') {
      $setBlocksType(sel, () => $createParagraphNode());
    } else {
      $setBlocksType(sel, () => $createHeadingNode(blockType));
    }
  });
}

/**
 * Wrap the current selection’s top-level blocks into a new list.
 *
 * - Gathers all distinct top-level blocks under the selection
 * - Creates a ListNode of `listType`
 * - Moves each block (or its children) into new list items
 *
 * @param editor   The LexicalEditor instance
 * @param listType 'bullet' | 'number'
 */
export function wrapSelectionInList(
  editor: LexicalEditor,
  listType: 'bullet' | 'number',
): void {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;

    const nodes = sel.getNodes();
    if (nodes.length === 0) return;

    // collect each top-level block once
    const topBlocks: Array<any> = [];
    nodes.forEach((n) => {
      const top = n.getTopLevelElementOrThrow();
      if (!topBlocks.includes(top)) topBlocks.push(top);
    });

    // create new list and insert before the first block
    const list = $createListNode(listType);
    topBlocks[0].insertBefore(list);

    // move each block into the new list
    topBlocks.forEach((block) => {
      if ($isListNode(block)) {
        list.append(...block.getChildren());
        block.remove();
      } else {
        const li = $createListItemNode();
        li.append(...block.getChildren());
        block.replace(li);
        list.append(li);
      }
    });

    list.select();
  });
}

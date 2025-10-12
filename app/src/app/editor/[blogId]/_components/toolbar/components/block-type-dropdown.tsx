'use client';

import { $isListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { $getSelection, $isRangeSelection, $isParagraphNode } from 'lexical';
import { useEffect, useState, useCallback } from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

import { BLOCK_TYPE_CONFIG, BlockType } from '../constants/block-options';
import { applyBlockType, wrapSelectionInList } from '../utils/editor-utils';

import CommandButton from './command-button';

export const BlockTypeDropdown = () => {
  const [editor] = useLexicalComposerContext();
  const [type, setType] = useState<BlockType>('paragraph');

  const detectType = useCallback(() => {
    editor.getEditorState().read(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return setType('paragraph');

      let node: any = sel.anchor.getNode();
      while (
        node &&
        !($isParagraphNode(node) || $isHeadingNode(node) || $isListNode(node))
      ) {
        node = node.getParent();
      }

      if ($isHeadingNode(node)) {
        setType(node.getTag() === 'h2' ? 'h2' : 'h3');
      } else if ($isListNode(node)) {
        setType(node.getListType() === 'bullet' ? 'bullet' : 'number');
      } else {
        setType('paragraph');
      }
    });
  }, [editor]);

  useEffect(() => {
    detectType();
    return editor.registerUpdateListener(() => detectType());
  }, [editor, detectType]);

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <CommandButton className="h-7 min-w-[135px]">
          <div className="flex w-full items-center justify-between">
            {(() => {
              const cfg = BLOCK_TYPE_CONFIG.find((c) => c.type === type)!;
              return (
                <div className="flex items-center gap-1">
                  <GIcon name={cfg.icon} className="text-foreground-light" />
                  <span className="text-foreground-light text-sm font-medium">
                    {cfg.label}
                  </span>
                </div>
              );
            })()}
            <GIcon
              name="keyboard_arrow_down"
              className="text-foreground-light size-4"
            />
          </div>
        </CommandButton>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={4}
          align="start"
          className="shadow-xs backdrop-blur-xs rounded-md border bg-white/30 p-1"
        >
          {BLOCK_TYPE_CONFIG.map((cfg) => (
            <Dropdown.Item
              key={cfg.type}
              onPointerDown={(e) => e.preventDefault()}
              onSelect={(e) => {
                e.preventDefault();
                if (cfg.type === 'bullet' || cfg.type === 'number') {
                  wrapSelectionInList(editor, cfg.type);
                } else {
                  applyBlockType(editor, cfg.type);
                }
              }}
              className={cn(
                'outline-hidden hover:bg-surface-200 flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm',
                cfg.type === type && 'bg-surface-200!',
              )}
            >
              <GIcon name={cfg.icon} size={14} /> {cfg.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
};

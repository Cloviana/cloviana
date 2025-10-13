'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { useEffect, useState } from 'react';

import { GIcon } from '@/components/deprecated/icons';

import CommandButton from './command-button';

export const UnderlineButton = () => {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection();
        setActive($isRangeSelection(sel) && sel.hasFormat('underline'));
      });
    });
  }, [editor]);

  const toggle = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  return (
    <CommandButton onClick={toggle} highlight={active}>
      <GIcon name="format_underlined" />
    </CommandButton>
  );
};

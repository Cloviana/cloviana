import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';

import { Node } from '@/types/api';

import { initializeLexicalNodes } from '../_utils/initialize-lexical-nodes';

export function InitialContentPlugin({ nodes }: { nodes: Node[] }) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    editor.update(
      () => {
        initializeLexicalNodes(nodes, editor);
      },
      { tag: 'init' },
    );
  }, [editor, nodes]);

  return null;
}

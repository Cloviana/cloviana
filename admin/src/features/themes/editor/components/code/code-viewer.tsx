'use client';

import Editor, { loader } from '@monaco-editor/react';
// Only the core and the syntax grammars: a read-only viewer has no use for language servers,
// which are most of Monaco's weight and would need their own workers.
import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/basic-languages/monaco.contribution.js';

import type { Selection } from '../../chat/model/run-context';
import { languageForPath } from '../../lib/language';

import { PlainCode } from './plain-code';

// Bundled rather than left to the library's default, which loads Monaco from a public CDN.
loader.config({ monaco });

self.MonacoEnvironment = {
  getWorker: () =>
    new Worker(new URL('./editor.worker.ts', import.meta.url), {
      type: 'module',
    }),
};

export default function CodeViewer({
  path,
  content,
  onSelectionChange,
}: {
  path: string;
  content: string;
  /** Called with the selected lines, or null when nothing is selected. */
  onSelectionChange?: (selection: Selection | null) => void;
}) {
  return (
    <Editor
      path={path}
      onMount={(editor) => {
        editor.onDidChangeCursorSelection(({ selection }) => {
          const model = editor.getModel();
          if (!onSelectionChange || !model) return;
          const text = selection.isEmpty()
            ? ''
            : model.getValueInRange(selection);
          onSelectionChange(
            text.trim()
              ? {
                  path,
                  startLine: selection.startLineNumber,
                  endLine: selection.endLineNumber,
                  text,
                }
              : null,
          );
        });
      }}
      value={content}
      language={languageForPath(path)}
      loading={<PlainCode content={content} />}
      options={{
        readOnly: true,
        domReadOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'none',
        fontSize: 13,
        padding: { top: 8 },
      }}
    />
  );
}

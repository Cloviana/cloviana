'use client';

import Editor, { loader } from '@monaco-editor/react';
// Only the core and the syntax grammars: a read-only viewer has no use for language servers,
// which are most of Monaco's weight and would need their own workers.
import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/basic-languages/monaco.contribution.js';

import { Spinner } from '@/components/ui/spinner';

import { languageForPath } from '../../lib/language';

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
}: {
  path: string;
  content: string;
}) {
  return (
    <Editor
      path={path}
      value={content}
      language={languageForPath(path)}
      loading={<Spinner />}
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

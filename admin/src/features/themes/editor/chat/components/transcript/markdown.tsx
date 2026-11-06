'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const plugins = [remarkGfm];

/** The assistant's written answer. Memoised so a long transcript doesn't re-render per token. */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="text-body text-text-default [&_a]:text-link-default [&_code]:bg-background-neutral [&_code]:text-code [&_pre]:bg-surface-sunken flex flex-col gap-2 break-words [&_a]:underline [&_code]:rounded-xs [&_code]:px-1 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={plugins}>{text}</ReactMarkdown>
    </div>
  );
});

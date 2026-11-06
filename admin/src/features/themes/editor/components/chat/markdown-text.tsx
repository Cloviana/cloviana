'use client';

import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';

const plugins = [remarkGfm];

export function MarkdownText() {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={plugins}
      className="text-body text-text-default [&_a]:text-link-default [&_code]:bg-background-neutral [&_code]:text-code flex flex-col gap-2 break-words [&_code]:rounded-xs [&_code]:px-1 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5"
    />
  );
}

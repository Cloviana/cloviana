'use client';

import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type BlogSource = { title: string; url: string };

export type BlogCanvasContent = {
  title: string;
  body: string;
  sources: BlogSource[];
};

type BlogCanvasProps = {
  content: BlogCanvasContent;
  onClose: () => void;
};

// ponytail: reuses same ReactMarkdown + remarkGfm as draft-viewer.tsx
export function BlogCanvas({ content, onClose }: BlogCanvasProps) {
  return (
    <div className="bg-background flex h-full flex-col border-l">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium truncate pr-2">{content.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="size-7 shrink-0">
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.body}
          </ReactMarkdown>
        </article>

        {content.sources.length > 0 && (
          <div className="border-t pt-3 mt-6">
            <p className="text-muted-foreground mb-1 text-xs font-medium">
              Sources
            </p>
            <ul className="space-y-1 text-sm">
              {content.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

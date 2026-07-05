'use client';

import { useState } from 'react';

import { BlogCanvas, type BlogCanvasContent } from '@/features/chat/components/blog-canvas';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { cn } from '@/utils/cn';

type ChatWithCanvasProps = {
  businessId: string;
  chatId?: string;
};

// ponytail: wraps ChatThread + BlogCanvas in a flex row; canvas slides in
export function ChatWithCanvas({ businessId, chatId }: ChatWithCanvasProps) {
  const [canvas, setCanvas] = useState<BlogCanvasContent | null>(null);

  return (
    <div className="flex h-full">
      <div
        className={cn(
          'h-full transition-all duration-300',
          canvas ? 'w-[55%]' : 'w-full',
        )}
      >
        <ChatThread
          businessId={businessId}
          chatId={chatId}
          onBlogReady={setCanvas}
        />
      </div>
      {canvas && (
        <div className="h-full w-[45%] transition-all duration-300">
          <BlogCanvas content={canvas} onClose={() => setCanvas(null)} />
        </div>
      )}
    </div>
  );
}

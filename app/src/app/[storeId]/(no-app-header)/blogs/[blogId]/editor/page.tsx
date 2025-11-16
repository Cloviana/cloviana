'use client';

import { SerializedEditorState } from 'lexical';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Anchor } from '@/components/ui/anchor';
import { paths } from '@/config/paths';
import { EditorHeader } from '@/features/blogs/components/editor/editor-header';
import { EditorMobileNotice } from '@/features/blogs/components/editor/editor-mobile-notice';
import { EditorSidebar } from '@/features/blogs/components/editor/editor-sidebar';
import { Editor } from '@/features/blogs/components/editor/editor-x/editor';
import { useBlogGeneration } from '@/features/blogs/hooks/use-blog-generation';
import { nodesToLexicalState } from '@/features/blogs/utils/nodes-to-lexical-json';

export default function EditorPage() {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(
    null,
  );
  const { blogId, storeId } = useParams() as {
    blogId: string;
    storeId: string;
  };
  const { blog, isSuccess } = useBlogGeneration(blogId, storeId);

  useEffect(() => {
    if (!editorState && blog?.nodes && blog.nodes.length > 0) {
      console.log(nodesToLexicalState(blog.nodes));
      setEditorState(nodesToLexicalState(blog.nodes));
    }
  }, [blog?.nodes, editorState]);

  if (!isSuccess && (!blog?.nodes || blog.nodes.length === 0)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <span className="loading loading-spinner loading-xs text-secondary"></span>
            <span className="text-sm font-medium">Generating blog</span>
          </div>
          <p className="text-foreground-light text-center text-sm">
            It may take a few minutes to generate, you will get an email once
            your blog is ready.
          </p>
          <Anchor
            className="text-foreground-light w-fit text-center text-sm"
            href={paths.store.blogs.getHref(storeId)}
            variant="subtle"
          >
            Return back to your store?
          </Anchor>
        </div>
      </div>
    );
  }

  if (!editorState) return null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <EditorMobileNotice />
      <div className="flex">
        <div className="flex size-10 items-center justify-center border-r border-b">
          <Link href={paths.store.blogs.getHref(storeId)}>
            <img
              src="/logo-icon.png"
              alt="logo"
              className="size-[18px] object-contain transition-transform hover:rotate-12"
            />
          </Link>
        </div>
        <div className="h-10 flex-1 border-b">
          <EditorHeader />{' '}
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="h-full min-w-10 border-r">
          <EditorSidebar />
        </div>
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <Editor
            editorSerializedState={editorState}
            onSerializedChange={(value) => setEditorState(value)}
          />
        </main>
      </div>
    </div>
  );
}

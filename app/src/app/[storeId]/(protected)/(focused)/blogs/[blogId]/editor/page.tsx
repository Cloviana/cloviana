'use client';

import { SerializedEditorState } from 'lexical';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppHeader } from '@/app/_components/header';
import { Field, FieldLabel } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { EditorHeader } from '@/features/blogs/components/editor/editor-header';
import { EditorMobileNotice } from '@/features/blogs/components/editor/editor-mobile-notice';
import { EditorSidebar } from '@/features/blogs/components/editor/editor-sidebar';
import { Editor } from '@/features/blogs/components/editor/editor-x/editor';
import { nodesToLexicalState } from '@/features/blogs/utils/nodes-to-lexical-json';
import { useJobWatcher } from '@/features/jobs/hooks/use-job-watcher';

export default function EditorPage() {
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();

  const [editorState, setEditorState] = useState<SerializedEditorState | null>(
    null,
  );

  const { data: blog, refetch: refetchBlog } = useGetBlog({ blogId, storeId });

  const isGenerating =
    blog?.job?.status === 'PENDING' || blog?.job?.status === 'RUNNING';

  const { data: jobWithRuntime } = useJobWatcher({
    storeId: blog?.storeId,
    jobId: blog?.jobId,
    initialStatus: blog?.job?.status,
    onSuccess: async () => {
      await refetchBlog();
    },
    enabled: isGenerating,
  });

  useEffect(() => {
    if (!editorState && blog?.nodes && blog.nodes.length > 0) {
      setEditorState(nodesToLexicalState(blog.nodes));
    }
  }, [blog?.nodes, editorState]);

  if (isGenerating && !jobWithRuntime) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Spinner
          className="text-foreground-light size-7"
          strokeWidth={3.4}
          variant="2"
        />
      </div>
    );
  }

  if (isGenerating && jobWithRuntime) {
    const percent = jobWithRuntime.runtime?.percent ?? 0;

    return (
      <div className="bg-studio flex h-screen w-full flex-col overflow-hidden">
        <header className="border-b">
          <AppHeader />
        </header>

        <main className="bg-background flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-2">
            <Field className="w-full max-w-sm">
              <FieldLabel htmlFor="progress-upload" className="font-medium">
                <span>{jobWithRuntime.runtime?.title ?? 'Initializing'}</span>
                <span className="ml-auto">{percent}%</span>
              </FieldLabel>
              <Progress
                value={percent}
                id="progress-upload"
                className="transition-all"
              />
            </Field>
          </div>
        </main>
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

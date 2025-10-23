'use client';

import debounce from 'lodash.debounce';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef } from 'react';

import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';

export const Title = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const { data: blog } = useGetBlog({ blogId });
  const { mutate } = useUpdateBlog();

  const ref = useRef<HTMLHeadingElement>(null);
  const saveRef = useRef<(t: string) => void>(() => {});

  useEffect(() => {
    const fn = debounce((t: string) => mutate({ title: t, blogId }), 500);
    saveRef.current = fn;
    return () => fn.cancel();
  }, [mutate, blogId]);

  useEffect(() => {
    const el = ref.current;
    const next = blog?.title ?? '';
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== next) el.textContent = next;
  }, [blog?.title]);

  if (!blog) return null;

  return (
    <h1
      ref={ref}
      className="w-full max-w-none text-2xl font-semibold focus:outline-hidden"
      contentEditable
      suppressContentEditableWarning
      aria-label="Blog title"
      onInput={(e) => saveRef.current(e.currentTarget.textContent ?? '')}
    >
      <span className="sr-only">Blog title</span>
    </h1>
  );
};

'use client';

import debounce from 'lodash.debounce';
import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';

export const Title = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const { data: blog } = useGetBlog(blogId);
  const update = useUpdateBlog(blogId);

  const [title, setTitle] = useState(blog?.title ?? '');

  const debouncedSave = useMemo(
    () =>
      debounce((newTitle: string) => {
        update.mutate({ title: newTitle });
      }, 500),
    [update],
  );

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLHeadingElement>) => {
      const newText = e.currentTarget.textContent || '';
      setTitle(newText);
      debouncedSave(newText);
    },
    [debouncedSave],
  );

  if (!blog) return null;

  return (
    <h1
      className="w-full max-w-none text-2xl font-semibold focus:outline-none"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
    >
      {title}
    </h1>
  );
};

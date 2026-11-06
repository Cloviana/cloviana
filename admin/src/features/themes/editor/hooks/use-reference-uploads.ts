'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { paths } from '@/config/paths';

import { attachmentProblem, isImage } from '../chat/model/attachment-rules';

export interface ReferenceItem {
  key: string;
  name: string;
  mimeType: string;
  /** A local preview, for images. */
  previewUrl?: string;
  /** Set once the API has the file. */
  id?: string;
}

interface Options {
  slug: string;
  themeId: string;
  /** The conversation the files belong to, created first if there isn't one yet. */
  ensureConversation: () => Promise<string>;
  onProblem: (message: string) => void;
}

/** Files attached to the next message: validated, uploaded in the background, and listed. */
export function useReferenceUploads({
  slug,
  themeId,
  ensureConversation,
  onProblem,
}: Options) {
  const [items, setItems] = useState<readonly ReferenceItem[]>([]);
  // The count a new file is checked against must include uploads still in flight.
  const count = useRef(0);

  const forget = useCallback((item: ReferenceItem) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }, []);

  const add = useCallback(
    async (files: readonly File[]) => {
      for (const file of files) {
        const problem = attachmentProblem(file, count.current);
        if (problem) {
          onProblem(problem);
          continue;
        }
        count.current += 1;
        const item: ReferenceItem = {
          key: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          previewUrl: isImage(file.type)
            ? URL.createObjectURL(file)
            : undefined,
        };
        setItems((current) => [...current, item]);
        try {
          const form = new FormData();
          form.set('file', file);
          form.set('conversationId', await ensureConversation());
          const response = await fetch(
            `${paths.mp.themes.editor.getHref(slug, themeId)}/attachments`,
            { method: 'POST', body: form },
          );
          if (!response.ok) throw new Error('upload failed');
          const { id } = (await response.json()) as { id: string };
          setItems((current) =>
            current.map((entry) =>
              entry.key === item.key ? { ...entry, id } : entry,
            ),
          );
        } catch {
          count.current -= 1;
          forget(item);
          setItems((current) =>
            current.filter((entry) => entry.key !== item.key),
          );
          onProblem(`Couldn't attach ${file.name}.`);
        }
      }
    },
    [ensureConversation, forget, onProblem, slug, themeId],
  );

  const remove = useCallback(
    (key: string) => {
      setItems((current) => {
        const gone = current.find((entry) => entry.key === key);
        if (gone) {
          forget(gone);
          count.current -= 1;
        }
        return current.filter((entry) => entry.key !== key);
      });
    },
    [forget],
  );

  /** After the message is sent, the files belong to it and the box starts empty. */
  const clear = useCallback(() => {
    setItems((current) => {
      current.forEach(forget);
      return [];
    });
    count.current = 0;
  }, [forget]);

  useEffect(
    () => () => items.forEach(forget),
    // Only on unmount: previews are released one by one as items are removed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const readyIds = items.flatMap((item) => (item.id ? [item.id] : []));
  const uploading = items.some((item) => !item.id);

  return { items, add, remove, clear, readyIds, uploading };
}

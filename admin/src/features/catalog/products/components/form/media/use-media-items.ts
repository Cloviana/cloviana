import { move } from '@dnd-kit/helpers';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { FileAsset } from '@/features/files';

import type { ProductMediaValue } from '../../../schemas/product.schema';

import { MAX_MEDIA, type MediaItem } from './media';

// The drag event `move` reads to find which item went where.
export type ReorderEvent = Parameters<typeof move>[1];

// Local previews and product changes remain separate from the shared file library.
export function useMediaItems(
  initialFiles: ProductMediaValue[] = [],
  onAdd: (file: File) => void,
  onRemove: (file: File) => void,
  getAssetId: (file: File) => string | undefined,
) {
  const urlsRef = useRef<string[]>([]);
  const [items, setItems] = useState<MediaItem[]>(() =>
    initialFiles.map((source) => {
      if (!(source instanceof File))
        return {
          id: 'id' in source ? source.id : source.assetId,
          source,
          name: 'Product image',
          url: source.url,
          ready: true,
        };
      const url = URL.createObjectURL(source);
      urlsRef.current.push(url);
      return {
        id: crypto.randomUUID(),
        source,
        name: source.name,
        url,
        ready: false,
      };
    }),
  );

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function addFiles(files: FileList | File[]) {
    const all = Array.from(files);
    // The picker's accept filter doesn't apply to dropped files.
    const images = all.filter((file) => file.type.startsWith('image/'));
    if (images.length < all.length) {
      toast.error('Only image files are supported.');
    }

    const room = MAX_MEDIA - items.length;
    if (images.length > room) {
      toast.error(`You can add up to ${MAX_MEDIA} images.`);
    }

    const added = images.slice(0, Math.max(room, 0)).map((file): MediaItem => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      return {
        id: crypto.randomUUID(),
        source: file,
        name: file.name,
        url,
        ready: false,
      };
    });
    if (added.length) {
      added.forEach((item) => {
        if (item.source instanceof File) onAdd(item.source);
      });
      setItems((current) => [...current, ...added]);
    }
  }

  function markReady(id: string, failed: boolean) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, ready: true, url: failed ? null : item.url }
          : item,
      ),
    );
  }

  function addExisting(files: FileAsset[]) {
    const used = new Set(
      items
        .map((item) =>
          item.source instanceof File
            ? getAssetId(item.source)
            : item.source.assetId,
        )
        .filter(Boolean),
    );
    const additions = files.filter((file) => !used.has(file.id));
    if (additions.length < files.length)
      toast.error('Some images are already in this product.');
    const room = MAX_MEDIA - items.length;
    if (additions.length > room)
      toast.error(`You can add up to ${MAX_MEDIA} images.`);
    const added = additions.slice(0, Math.max(room, 0)).map(
      (file): MediaItem => ({
        id: file.id,
        source: { assetId: file.id, url: file.url },
        name: file.filename || 'Product image',
        url: file.url,
        ready: true,
      }),
    );
    if (added.length) setItems((current) => [...current, ...added]);
  }

  function remove(ids: Set<string>) {
    items.forEach((item) => {
      if (ids.has(item.id) && item.source instanceof File) {
        onRemove(item.source);
        if (item.url) URL.revokeObjectURL(item.url);
      }
    });
    setItems((current) => current.filter((item) => !ids.has(item.id)));
  }

  // Called while a tile is dragged over another: the order is state, since the first tile is larger than the rest.
  function reorder(event: ReorderEvent) {
    setItems((current) => move(current, event));
  }

  // Puts items back in a previous order, e.g. when a drag is cancelled.
  function restoreOrder(order: string[]) {
    setItems((current) =>
      [...current].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)),
    );
  }

  return {
    items,
    addFiles,
    addExisting,
    markReady,
    remove,
    reorder,
    restoreOrder,
  };
}

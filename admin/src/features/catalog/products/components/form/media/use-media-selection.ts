import { useState } from 'react';

import type { MediaItem } from './media';

export function useMediaSelection(items: MediaItem[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = items.length > 0 && selected.size === items.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(items.map((item) => item.id)),
    );
  }

  function clear() {
    setSelected(new Set());
  }

  return { selected, allSelected, toggle, toggleAll, clear };
}

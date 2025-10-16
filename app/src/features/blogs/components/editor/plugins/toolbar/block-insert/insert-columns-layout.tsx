'use client';

import { Columns3Icon } from 'lucide-react';

import { SelectItem } from '@/components/ui/select';
import { useToolbarContext } from '@/features/blogs/components/editor/context/toolbar-context';
import { InsertLayoutDialog } from '@/features/blogs/components/editor/plugins/layout-plugin';

export function InsertColumnsLayout() {
  const { activeEditor, showModal } = useToolbarContext();

  return (
    <SelectItem
      value="columns"
      onPointerUp={() =>
        showModal('Insert Columns Layout', (onClose) => (
          <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <div className="flex items-center gap-1">
        <Columns3Icon className="size-4" />
        <span>Columns Layout</span>
      </div>
    </SelectItem>
  );
}

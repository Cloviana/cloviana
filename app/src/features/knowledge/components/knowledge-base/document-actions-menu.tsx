import { EllipsisVertical, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import type { Document } from '@/types/api';

type DocumentActionsMenuProps = {
  document: Document;
  disabled: boolean;
  loading: boolean;
  onDelete: () => void;
};

export function DocumentActionsMenu({
  document,
  disabled,
  loading,
  onDelete,
}: DocumentActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground size-7"
          aria-label={`Actions for ${document.name}`}
          disabled={disabled}
        >
          {loading ? <Spinner className="size-3.5" /> : <EllipsisVertical />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

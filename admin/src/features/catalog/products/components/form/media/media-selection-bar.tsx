import { Checkbox } from '@/components/ui/checkbox';

// Replaces the "Media" label while any media is selected.
export function MediaSelectionBar({
  count,
  allSelected,
  onToggleAll,
  onRemove,
}: {
  count: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-h-5 items-center justify-between">
      <div className="text-body-small flex items-center gap-2">
        <Checkbox
          // Tick when everything is selected, dash when only some are.
          checked={allSelected}
          indeterminate={count > 0 && !allSelected}
          onCheckedChange={onToggleAll}
          aria-label={allSelected ? 'Deselect all media' : 'Select all media'}
          className="size-4"
        />
        <span>
          {count} {count === 1 ? 'file' : 'files'} selected
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-body text-text-danger underline-offset-2 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}

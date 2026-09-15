'use client';

import { Radio, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useDeletePrompts } from '@/features/prompts/api/delete-prompts';
import { useSetPromptsActive } from '@/features/prompts/api/set-prompts-active';

export function PromptsSelectionBar({
  businessId,
  selectedPromptIds,
  selectedCount,
  activeCount,
  onClear,
}: {
  businessId: string;
  selectedPromptIds: string[];
  // Counts cover the current page only, so a selection spanning pages can read
  // as mixed rather than the select having to guess at one value.
  selectedCount: number;
  activeCount: number;
  onClear: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const setPromptsActive = useSetPromptsActive({
    mutationConfig: {
      onSuccess: (_result, { active, promptIds }) => {
        toast.success(
          `${promptIds.length} prompt${promptIds.length === 1 ? '' : 's'} ${
            active ? 'activated' : 'deactivated'
          }.`,
        );
        onClear();
      },
      onError: () => toast.error('Could not update prompts.'),
    },
  });
  const deletePrompts = useDeletePrompts({
    mutationConfig: {
      onSuccess: (_result, { promptIds }) => {
        toast.success(
          `${promptIds.length} prompt${
            promptIds.length === 1 ? '' : 's'
          } deleted.`,
        );
        setDeleteOpen(false);
        onClear();
      },
      onError: () => toast.error('Could not delete prompts.'),
    },
  });

  if (!selectedPromptIds.length) return null;

  const promptCount = selectedPromptIds.length;
  const promptNoun = `prompt${promptCount === 1 ? '' : 's'}`;
  // undefined leaves the placeholder showing, which is how a mixed selection
  // stays honest instead of being rounded to one of the two values.
  const selectedStatus =
    selectedCount === 0 || (activeCount > 0 && activeCount < selectedCount)
      ? undefined
      : activeCount === selectedCount
        ? 'active'
        : 'inactive';
  // Show the requested value while it is in flight so the select settles
  // immediately. react-query drops `variables` once the mutation finishes, so a
  // failure snaps it back with no rollback code.
  const displayedStatus = setPromptsActive.isPending
    ? setPromptsActive.variables.active
      ? 'active'
      : 'inactive'
    : selectedStatus;

  return (
    <div
      role="toolbar"
      aria-label="Prompt selection actions"
      className="bg-surface absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border p-1 shadow-lg"
    >
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Clear {promptCount} selected
      </Button>

      <Separator orientation="vertical" className="h-5!" />

      <Select
        value={displayedStatus}
        disabled={setPromptsActive.isPending}
        onValueChange={(value) =>
          setPromptsActive.mutate({
            businessId,
            promptIds: selectedPromptIds,
            active: value === 'active',
          })
        }
      >
        <SelectTrigger
          variant="ghost"
          size="sm"
          aria-label="Prompt status"
          className="text-xs"
        >
          <Radio />
          Status
        </SelectTrigger>
        <SelectContent align="start" className="w-64">
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <p className="text-foreground-light mt-1 border-t px-2 pt-2 text-[13px] leading-5">
            Inactive prompts stop running but keep their history.
          </p>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
        Delete
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete {promptCount} {promptNoun}?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes {promptCount === 1 ? 'it' : 'them'} along
              with every response, mention and metric recorded so far. It cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={deletePrompts.isPending}
              onClick={() =>
                deletePrompts.mutate({
                  businessId,
                  promptIds: selectedPromptIds,
                })
              }
            >
              Delete {promptNoun}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { GripVertical, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUpdateCompetitor } from '@/features/competitors/api/update-competitor';
import type { Competitor } from '@/types/api';

type CompetitorTrackedNamesProps = {
  businessId: string;
  competitor: Competitor;
};

function getTrackedNames(competitor: Competitor) {
  return competitor.aliases.length > 0 ? competitor.aliases : [competitor.name];
}

function normalizeTrackedNames(names: string[]) {
  return Array.from(
    new Map(
      names
        .map((name) => name.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .map((name) => [name.toLocaleLowerCase(), name]),
    ).values(),
  );
}

export function CompetitorTrackedNames({
  businessId,
  competitor,
}: CompetitorTrackedNamesProps) {
  const currentNames = getTrackedNames(competitor);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [trackedNames, setTrackedNames] = useState(currentNames);
  const updateCompetitor = useUpdateCompetitor();
  const normalizedDraft = draft.trim().replace(/\s+/g, ' ');
  const namesToSave = normalizeTrackedNames(trackedNames);
  const canCreateDraft =
    Boolean(normalizedDraft) &&
    !trackedNames.some(
      (name) =>
        name.toLocaleLowerCase() === normalizedDraft.toLocaleLowerCase(),
    );
  const hasChanges =
    namesToSave.length !== currentNames.length ||
    namesToSave.some((name, index) => name !== currentNames[index]);
  const canSave =
    namesToSave.length > 0 && hasChanges && !updateCompetitor.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (updateCompetitor.isPending) return;
    setOpen(nextOpen);
    if (nextOpen) {
      setDraft('');
      setTrackedNames(getTrackedNames(competitor));
    }
  }

  function addDraft() {
    if (!canCreateDraft) return;
    setTrackedNames((names) =>
      normalizeTrackedNames([...names, normalizedDraft]),
    );
    setDraft('');
  }

  function removeTrackedName(name: string) {
    if (trackedNames.length <= 1) return;
    setTrackedNames((names) => names.filter((item) => item !== name));
  }

  function saveTrackedNames(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    updateCompetitor.mutate(
      {
        businessId,
        competitorId: competitor.id,
        aliases: namesToSave,
      },
      {
        onSuccess: () => {
          toast.success('Tracked names updated');
          setOpen(false);
        },
        onError: () => toast.error('Could not update tracked names'),
      },
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent block max-w-full truncate rounded-md px-1.5 py-1 text-left transition-colors"
        >
          {currentNames.join(', ')}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-80 p-0">
        <form onSubmit={saveTrackedNames}>
          <div className="border-b p-2">
            <div className="relative">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.preventDefault();
                }}
                placeholder="Create and add tracked names"
                className="pr-8"
                maxLength={100}
                autoFocus
                disabled={updateCompetitor.isPending}
                aria-label="Add tracked name"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setDraft('')}
                disabled={updateCompetitor.isPending || !draft}
                aria-label="Clear tracked name"
              >
                <X />
              </Button>
            </div>
          </div>
          {normalizedDraft ? (
            <div className="p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={addDraft}
                disabled={!canCreateDraft || updateCompetitor.isPending}
              >
                <span className="text-muted-foreground">Create</span>
                <span className="bg-muted max-w-full truncate rounded-md border px-1.5 py-0.5 text-xs font-medium">
                  {normalizedDraft}
                </span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              <p className="text-muted-foreground text-[13px] font-medium">
                Tracked names
              </p>
              <ul className="space-y-1">
                {trackedNames.map((name) => (
                  <li
                    key={name}
                    className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1"
                  >
                    <GripVertical
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeTrackedName(name)}
                      disabled={
                        updateCompetitor.isPending || trackedNames.length <= 1
                      }
                      aria-label={`Remove ${name}`}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border-t p-2 text-right">
            <Button
              type="submit"
              size="sm"
              loading={updateCompetitor.isPending}
              disabled={!canSave}
            >
              Save changes
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

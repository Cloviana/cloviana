import { CornerDownLeft, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
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

type CompetitorDisplayNameProps = {
  businessId: string;
  competitor: Competitor;
  children: ReactNode;
};

export function CompetitorDisplayName({
  businessId,
  competitor,
  children,
}: CompetitorDisplayNameProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(competitor.name);
  const updateCompetitor = useUpdateCompetitor();
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  const canSave =
    Boolean(normalizedName) &&
    normalizedName !== competitor.name &&
    !updateCompetitor.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (updateCompetitor.isPending) return;
    setOpen(nextOpen);
    if (nextOpen) setName(competitor.name);
  }

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    updateCompetitor.mutate(
      {
        businessId,
        competitorId: competitor.id,
        name: normalizedName,
      },
      {
        onSuccess: () => {
          toast.success('Competitor name updated');
          setOpen(false);
        },
        onError: () => toast.error('Could not update competitor name'),
      },
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent data-[state=open]:bg-accent flex max-w-full min-w-0 items-center rounded-md px-1.5 py-1 text-left transition-colors"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-80 p-0">
        <form onSubmit={saveName}>
          <div className="space-y-3 p-3">
            <label
              htmlFor={`competitor-name-${competitor.id}`}
              className="text-muted-foreground block text-sm font-medium"
            >
              Display name
            </label>
            <div className="relative">
              <Input
                id={`competitor-name-${competitor.id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                className="pr-8"
                maxLength={100}
                autoFocus
                disabled={updateCompetitor.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setName('')}
                disabled={updateCompetitor.isPending || !name}
                aria-label="Clear display name"
              >
                <X />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Press{' '}
              <kbd className="bg-muted inline-flex items-center gap-1 rounded border px-1.5 py-0.5 align-middle font-sans">
                <CornerDownLeft className="size-3" /> enter
              </kbd>{' '}
              to save edit
            </p>
          </div>
          <div className="border-t p-3 text-right">
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

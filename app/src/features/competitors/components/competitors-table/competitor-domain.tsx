import { CornerDownLeft, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getCompetitorError } from '@/features/competitors/api/competitor-error';
import { useUpdateCompetitor } from '@/features/competitors/api/update-competitor';
import type { Competitor } from '@/types/api';

const DOMAIN_PATTERN = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

type CompetitorDomainProps = {
  businessId: string;
  competitor: Competitor;
};

export function CompetitorDomain({
  businessId,
  competitor,
}: CompetitorDomainProps) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState(competitor.domain);
  const updateCompetitor = useUpdateCompetitor();
  const normalizedDomain = domain.trim().toLocaleLowerCase();
  const isValidDomain = DOMAIN_PATTERN.test(normalizedDomain);
  const canSave =
    isValidDomain &&
    normalizedDomain !== competitor.domain &&
    !updateCompetitor.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (updateCompetitor.isPending) return;
    setOpen(nextOpen);
    if (nextOpen) setDomain(competitor.domain);
  }

  function saveDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    updateCompetitor.mutate(
      {
        businessId,
        competitorId: competitor.id,
        domain: normalizedDomain,
      },
      {
        onSuccess: () => {
          toast.success('Competitor domain updated');
          setOpen(false);
        },
        onError: (error) =>
          toast.error(
            getCompetitorError(error, 'Could not update competitor domain'),
          ),
      },
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex max-w-full min-w-0 items-center rounded-md px-1.5 py-1 text-left transition-colors"
        >
          <span className="truncate">{competitor.domain}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-80 p-0">
        <form onSubmit={saveDomain}>
          <div className="space-y-3 p-3">
            <label
              htmlFor={`competitor-domain-${competitor.id}`}
              className="text-muted-foreground block text-sm font-medium"
            >
              Domain
            </label>
            <div className="relative">
              <Input
                id={`competitor-domain-${competitor.id}`}
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                className="pr-8"
                maxLength={253}
                autoFocus
                disabled={updateCompetitor.isPending}
                aria-invalid={Boolean(normalizedDomain) && !isValidDomain}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setDomain('')}
                disabled={updateCompetitor.isPending || !domain}
                aria-label="Clear domain"
              >
                <X />
              </Button>
            </div>
            {normalizedDomain && !isValidDomain ? (
              <p className="text-destructive text-xs">
                Enter a valid domain without http or paths
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Press{' '}
                <kbd className="bg-muted inline-flex items-center gap-1 rounded border px-1.5 py-0.5 align-middle font-sans">
                  <CornerDownLeft className="size-3" /> enter
                </kbd>{' '}
                to save edit
              </p>
            )}
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

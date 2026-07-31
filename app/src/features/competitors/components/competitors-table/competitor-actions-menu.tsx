import { Ellipsis, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDeleteCompetitor } from '@/features/competitors/api/delete-competitor';
import type { Competitor } from '@/types/api';

type CompetitorActionsMenuProps = {
  businessId: string;
  competitor: Competitor;
};

export function CompetitorActionsMenu({
  businessId,
  competitor,
}: CompetitorActionsMenuProps) {
  const deleteCompetitor = useDeleteCompetitor({
    mutationConfig: {
      onSuccess: () => toast.success('Competitor deleted'),
      onError: () => toast.error('Could not delete competitor'),
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground size-7"
          aria-label={`Actions for ${competitor.name}`}
          disabled={deleteCompetitor.isPending}
        >
          <Ellipsis />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64 space-y-3 p-3">
        <p className="text-muted-foreground px-1 text-[13px] leading-5">
          Permanently delete this brand and all associated data.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          size={'sm'}
          loading={deleteCompetitor.isPending}
          onClick={() =>
            deleteCompetitor.mutate({
              businessId,
              competitorId: competitor.id,
            })
          }
        >
          <Trash2 />
          Delete brand
        </Button>
      </PopoverContent>
    </Popover>
  );
}

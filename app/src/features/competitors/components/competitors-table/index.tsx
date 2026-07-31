'use client';

import { useSearchParams } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetCompetitors } from '@/features/competitors/api/get-competitors';

import { CompetitorActionsMenu } from './competitor-actions-menu';
import { CompetitorDisplayName } from './competitor-display-name';
import { CompetitorDomain } from './competitor-domain';
import { CompetitorTrackedNames } from './competitor-tracked-names';

type CompetitorsTableProps = {
  businessId: string;
};

export function CompetitorsTable({ businessId }: CompetitorsTableProps) {
  const searchParams = useSearchParams();
  const competitorsQuery = useGetCompetitors(businessId);
  const competitors = competitorsQuery.data ?? [];
  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase();
  const filteredCompetitors = searchQuery
    ? competitors.filter((competitor) =>
        [competitor.name, competitor.domain, ...competitor.aliases].some(
          (value) => value.toLowerCase().includes(searchQuery),
        ),
      )
    : competitors;

  return (
    <div className="bg-surface min-h-0 flex-1 overflow-y-auto">
      <Table className="table-fixed">
        <TableCaption className="sr-only">
          Competitors tracked for this business.
        </TableCaption>
        <TableHeader className="border-t">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 w-[36%] px-4 text-xs">
              Display name
            </TableHead>
            <TableHead className="h-10 w-[32%] px-4 text-xs">
              Tracked names
            </TableHead>
            <TableHead className="h-10 w-[32%] px-4 text-xs">Domains</TableHead>
            <TableHead className="h-10 w-14 px-3 text-xs">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b">
          {filteredCompetitors.map((competitor) => {
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
              competitor.domain,
            )}&sz=64`;

            return (
              <TableRow key={competitor.id} className="h-11">
                <TableCell className="min-w-0 px-4 py-2">
                  <CompetitorDisplayName
                    businessId={businessId}
                    competitor={competitor}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="size-5 rounded-md">
                        <AvatarImage
                          src={faviconUrl}
                          alt={`${competitor.name} favicon`}
                        />
                        <AvatarFallback className="rounded-md text-xs font-medium">
                          {competitor.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{competitor.name}</span>
                    </div>
                  </CompetitorDisplayName>
                </TableCell>
                <TableCell className="min-w-0 px-4 py-2">
                  <CompetitorTrackedNames
                    businessId={businessId}
                    competitor={competitor}
                  />
                </TableCell>
                <TableCell className="min-w-0 px-4 py-2">
                  <CompetitorDomain
                    businessId={businessId}
                    competitor={competitor}
                  />
                </TableCell>
                <TableCell className="px-3 py-2 text-right">
                  <CompetitorActionsMenu
                    businessId={businessId}
                    competitor={competitor}
                  />
                </TableCell>
              </TableRow>
            );
          })}

          {filteredCompetitors.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground h-28 text-center"
              >
                {competitorsQuery.isError
                  ? 'Could not load competitors.'
                  : competitors.length === 0
                    ? 'No competitors added yet.'
                    : 'No competitors match your search.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

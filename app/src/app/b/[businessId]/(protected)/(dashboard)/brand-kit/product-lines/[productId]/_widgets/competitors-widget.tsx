'use client';

import { CornerDownLeft, Trash2, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  StickyTableCell,
  StickyTableHead,
  Table,
  TableBody,
  TableCell,
  TableEmptyValue,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import {
  useDeleteCompetitor,
  useGetCompetitors,
  useUpdateCompetitor,
} from '@/features/brand-kit/api/competitors';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { COMPETITOR_DOMAIN_PATTERN } from '@/features/brand-kit/utils/competitor';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import type { Competitor } from '@/types/api';
import { getFaviconUrl } from '@/utils/domain';

import { AddCompetitorsDialog } from '../_components/add-competitors-dialog';

type CompetitorsWidgetProps = {
  businessId: string;
  productId: string;
  className?: string;
};

export function CompetitorsWidget({
  businessId,
  productId,
  className,
}: CompetitorsWidgetProps) {
  const { draft, setDraft } = useBrandKitDraft();
  const competitorsQuery = useGetCompetitors(businessId);
  const confirmDelete = useDeleteConfirmation();
  const product = draft.products.find((item) => item.id === productId);
  const competitors = (competitorsQuery.data ?? []).filter((competitor) =>
    product?.competitorBrandIds.includes(competitor.id),
  );
  const deleteCompetitor = useDeleteCompetitor({
    mutationConfig: {
      onSuccess: (_, { competitorId }) => {
        setDraft((previous) => ({
          ...previous,
          products: previous.products.map((item) => ({
            ...item,
            competitorBrandIds: item.competitorBrandIds.filter(
              (id) => id !== competitorId,
            ),
          })),
        }));
        toast.success('Competitor deleted');
      },
      onError: () => toast.error('Could not delete competitor'),
    },
  });

  function handleDelete(competitor: Competitor) {
    confirmDelete({
      title: 'Delete competitor?',
      description: `Are you sure you want to delete “${competitor.name}”? It will be removed from every product. This action cannot be undone.`,
      confirmLabel: 'Delete competitor',
      onConfirm: () =>
        deleteCompetitor.mutateAsync({
          businessId,
          competitorId: competitor.id,
        }),
    });
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Product Competitors</CardTitle>
        <CardDescription>
          Track the brands this product should be compared against.
        </CardDescription>
        <CardAction>
          <AddCompetitorsDialog businessId={businessId} productId={productId} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <TableFrame variant="bordered">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="group">
                <StickyTableHead interactive className="w-[26%]">
                  Display name
                </StickyTableHead>
                <TableHead className="w-[24%]">Tracked names</TableHead>
                <TableHead className="w-[22%]">Domain</TableHead>
                <TableHead className="w-[22%]">Products</TableHead>
                <TableHead className="w-14 px-2">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor) => (
                <CompetitorRow
                  key={competitor.id}
                  businessId={businessId}
                  competitor={competitor}
                  productNames={draft.products
                    .filter((item) =>
                      item.competitorBrandIds.includes(competitor.id),
                    )
                    .map(({ id, name }) => ({ id, name }))}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>

          {competitors.length === 0 && (
            <Empty className="bg-surface min-h-0 rounded-none">
              <EmptyHeader>
                <EmptyTitle className="text-xs">No competitors yet</EmptyTitle>
                <EmptyDescription className="text-xs">
                  Add the first competitor for this product.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TableFrame>
      </CardContent>
    </Card>
  );
}

type CompetitorRowProps = {
  businessId: string;
  competitor: Competitor;
  productNames: Array<{ id: string; name: string }>;
  onDelete: (competitor: Competitor) => void;
};

function CompetitorRow({
  businessId,
  competitor,
  productNames,
  onDelete,
}: CompetitorRowProps) {
  return (
    <TableRow className="group h-11">
      <StickyTableCell interactive>
        <CompetitorDisplayName businessId={businessId} competitor={competitor}>
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-5 shrink-0 rounded-md">
              <AvatarImage
                src={getFaviconUrl(competitor.domain)}
                alt={`${competitor.name} favicon`}
              />
              <AvatarFallback className="rounded-md text-xs font-medium">
                {competitor.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium">
              {competitor.name}
            </span>
          </div>
        </CompetitorDisplayName>
      </StickyTableCell>
      <TableCell className="text-xs">
        <CompetitorTrackedNames
          businessId={businessId}
          competitor={competitor}
        />
      </TableCell>
      <TableCell className="text-xs">
        <CompetitorDomain businessId={businessId} competitor={competitor} />
      </TableCell>
      <TableCell className="max-w-55">
        <ProductBadges products={productNames} />
      </TableCell>
      <TableCell className="w-14 px-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${competitor.name}`}
          onClick={() => onDelete(competitor)}
        >
          <Trash2 />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ProductBadges({
  products,
}: {
  products: Array<{ id: string; name: string }>;
}) {
  if (products.length === 0) return <TableEmptyValue />;

  return (
    <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto">
      {products.map((product) => (
        <Badge key={product.id} variant="muted" size="sm" className="shrink-0">
          {product.name}
        </Badge>
      ))}
    </div>
  );
}

type CompetitorDisplayNameProps = {
  businessId: string;
  competitor: Competitor;
  children: ReactNode;
};

function CompetitorDisplayName({
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
          <Field className="p-3">
            <FieldLabel htmlFor={`competitor-name-${competitor.id}`}>
              Display name
            </FieldLabel>
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
            <FieldDescription>
              Press{' '}
              <kbd className="bg-muted inline-flex items-center gap-1 rounded border px-1.5 py-0.5 align-middle font-sans">
                <CornerDownLeft className="size-3" /> Enter
              </kbd>{' '}
              to save your changes.
            </FieldDescription>
          </Field>
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

type CompetitorDomainProps = {
  businessId: string;
  competitor: Competitor;
};

function CompetitorDomain({ businessId, competitor }: CompetitorDomainProps) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState(competitor.domain);
  const updateCompetitor = useUpdateCompetitor();
  const normalizedDomain = domain.trim().toLowerCase();
  const isValidDomain = COMPETITOR_DOMAIN_PATTERN.test(normalizedDomain);
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
            getBrandKitError(error, 'Could not update competitor domain'),
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
          <Field className="p-3">
            <FieldLabel htmlFor={`competitor-domain-${competitor.id}`}>
              Domain
            </FieldLabel>
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
              <FieldError>
                Enter a valid domain without http or paths
              </FieldError>
            ) : (
              <FieldDescription>
                Press{' '}
                <kbd className="bg-muted inline-flex items-center gap-1 rounded border px-1.5 py-0.5 align-middle font-sans">
                  <CornerDownLeft className="size-3" /> Enter
                </kbd>{' '}
                to save your changes.
              </FieldDescription>
            )}
          </Field>
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
        .map((name) => [name.toLowerCase(), name]),
    ).values(),
  );
}

function CompetitorTrackedNames({
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
      (name) => name.toLowerCase() === normalizedDraft.toLowerCase(),
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
          <Field className="border-b p-2">
            <FieldLabel
              className="sr-only"
              htmlFor={`tracked-name-draft-${competitor.id}`}
            >
              Alternative name
            </FieldLabel>
            <div className="relative">
              <Input
                id={`tracked-name-draft-${competitor.id}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.preventDefault();
                }}
                placeholder="Add an alternative name"
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
          </Field>
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
              <p className="text-muted-foreground text-xs">
                Alternative names used for this competitor.
              </p>
              <ul className="space-y-1">
                {trackedNames.map((name) => (
                  <li
                    key={name}
                    className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1"
                  >
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

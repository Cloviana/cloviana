'use client';

import { FileText, Link2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import {
  useCreateBrandKitSample,
  useDeleteBrandKitSample,
} from '@/features/brand-kit/api/samples';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type {
  BrandKitAudience,
  BrandKitRegion,
  BrandKitSample,
} from '@/features/brand-kit/types';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';

import {
  AddSampleDialog,
  type SampleFormValues,
} from '../_components/add-sample-dialog';

type SamplesWidgetProps = {
  contentTypeId: string;
  className?: string;
};

export function SamplesWidget({
  contentTypeId,
  className,
}: SamplesWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const createSample = useCreateBrandKitSample();
  const deleteSample = useDeleteBrandKitSample();
  const confirmDelete = useDeleteConfirmation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const samples = draft.samples.filter(
    (sample) => sample.contentTypeId === contentTypeId,
  );

  async function addSample(values: SampleFormValues) {
    try {
      const { item } = await createSample.mutateAsync({
        businessId,
        id: crypto.randomUUID(),
        kind: 'URL',
        value: values.value,
        contentTypeId,
        audienceIds: values.audienceIds,
        regionIds: values.regionIds,
      });
      setDraft((previous) => ({
        ...previous,
        samples: [...previous.samples, item],
      }));
      return true;
    } catch (error) {
      toast.error(getBrandKitError(error, 'Could not add sample'));
      return false;
    }
  }

  async function removeSample(sampleId: string) {
    await deleteSample.mutateAsync({ businessId, sampleId });
    setDraft((previous) => ({
      ...previous,
      samples: previous.samples.filter((sample) => sample.id !== sampleId),
    }));
  }

  function handleDelete(sample: BrandKitSample) {
    confirmDelete({
      title: 'Delete sample?',
      description:
        'Are you sure you want to delete this sample? It will also be removed from any audience or region it is assigned to. This action cannot be undone.',
      confirmLabel: 'Delete sample',
      onConfirm: () => removeSample(sample.id),
    });
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Samples</CardTitle>
          <CardDescription>
            Add strong examples of this format. Samples guide style and
            structure, not factual claims.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus />
              Add Sample
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <SamplesList
            samples={samples}
            audiences={draft.audiences}
            regions={draft.regions}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <AddSampleDialog
        open={addDialogOpen}
        audiences={draft.audiences}
        regions={draft.regions}
        submitting={createSample.isPending}
        onOpenChange={setAddDialogOpen}
        onAdd={addSample}
      />
    </>
  );
}

type SamplesListProps = {
  samples: BrandKitSample[];
  audiences: BrandKitAudience[];
  regions: BrandKitRegion[];
  onDelete: (sample: BrandKitSample) => void;
};

function SamplesList({
  samples,
  audiences,
  regions,
  onDelete,
}: SamplesListProps) {
  const audienceNames = new Map(
    audiences.map((audience) => [audience.id, audience.name]),
  );
  const regionNames = new Map(
    regions.map((region) => [region.id, region.name]),
  );

  if (samples.length === 0) {
    return (
      <Empty className="bg-surface min-h-0 rounded-lg border">
        <EmptyHeader>
          <EmptyTitle className="text-xs">No samples yet</EmptyTitle>
          <EmptyDescription className="text-xs">
            Add your first published example.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup className="gap-2">
      {samples.map((sample) => {
        const assignedAudiences = sample.audienceIds.flatMap((id) => {
          const name = audienceNames.get(id);
          return name ? [name] : [];
        });
        const assignedRegions = sample.regionIds.flatMap((id) => {
          const name = regionNames.get(id);
          return name ? [name] : [];
        });

        return (
          <Item
            key={sample.id}
            variant="outline"
            size="sm"
            className="min-w-0 flex-nowrap"
          >
            <ItemMedia variant="icon" className="text-muted-foreground">
              {sample.kind === 'URL' ? <Link2 /> : <FileText />}
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="w-full min-w-0 text-xs">
                {sample.kind === 'URL' ? (
                  <a
                    href={sample.value}
                    target="_blank"
                    rel="noreferrer"
                    className="block min-w-0 truncate hover:underline"
                    title={sample.value}
                  >
                    {sample.value}
                  </a>
                ) : (
                  <span className="line-clamp-2" title={sample.value}>
                    {sample.value}
                  </span>
                )}
              </ItemTitle>
              <AssignmentBadges
                names={[...assignedAudiences, ...assignedRegions]}
              />
            </ItemContent>
            <ItemActions>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete sample"
                onClick={() => onDelete(sample)}
              >
                <Trash2 />
              </Button>
            </ItemActions>
          </Item>
        );
      })}
    </ItemGroup>
  );
}

function AssignmentBadges({ names }: { names: string[] }) {
  if (names.length === 0) return null;

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Badge variant="muted" size="sm">
        {names[0]}
      </Badge>
      {names.length > 1 && (
        <Badge variant="muted" size="sm" title={names.slice(1).join(', ')}>
          +{names.length - 1}
        </Badge>
      )}
    </div>
  );
}

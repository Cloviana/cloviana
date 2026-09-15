'use client';

import { FileText, Link2, Plus, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useUpdateBrandKitSample } from '@/features/brand-kit/api/samples';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type { BrandKitSample } from '@/features/brand-kit/types';
import { cn } from '@/utils/cn';

type AssignmentScope = 'audience' | 'region';

type SampleAssignmentsWidgetProps = {
  scope: AssignmentScope;
  scopeId: string;
  className?: string;
};

export function SampleAssignmentsWidget({
  scope,
  scopeId,
  className,
}: SampleAssignmentsWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const updateSample = useUpdateBrandKitSample();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const config = getAssignmentConfig(draft, scope, scopeId);
  const assignedSamples = draft.samples.filter(config.isAssigned);
  const contentTypeNames = new Map(
    draft.contentTypes.map((contentType) => [contentType.id, contentType.name]),
  );

  function openDialog() {
    setSelectedSampleIds(assignedSamples.map((sample) => sample.id));
    setDialogOpen(true);
  }

  async function updateAssignment(sample: BrandKitSample, assigned: boolean) {
    const currentIds =
      scope === 'audience' ? sample.audienceIds : sample.regionIds;
    const assignmentIds = assigned
      ? [...new Set([...currentIds, scopeId])]
      : currentIds.filter((id) => id !== scopeId);
    const { item } = await updateSample.mutateAsync(
      scope === 'audience'
        ? {
            businessId,
            sampleId: sample.id,
            audienceIds: assignmentIds,
          }
        : {
            businessId,
            sampleId: sample.id,
            regionIds: assignmentIds,
          },
    );

    setDraft((previous) => ({
      ...previous,
      samples: previous.samples.map((existing) =>
        existing.id === item.id ? item : existing,
      ),
    }));
  }

  async function saveAssignments(sampleIds: string[]) {
    try {
      const selected = new Set(sampleIds);
      const changedSamples = draft.samples.filter(
        (sample) => config.isAssigned(sample) !== selected.has(sample.id),
      );

      for (const sample of changedSamples) {
        await updateAssignment(sample, selected.has(sample.id));
      }

      setDialogOpen(false);
    } catch (error) {
      toast.error(
        getBrandKitError(error, 'Could not update sample assignments'),
      );
    }
  }

  async function removeAssignment(sample: BrandKitSample) {
    try {
      await updateAssignment(sample, false);
    } catch (error) {
      toast.error(
        getBrandKitError(error, 'Could not remove sample assignment'),
      );
    }
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="primary"
              disabled={draft.samples.length === 0}
              onClick={openDialog}
            >
              <Plus />
              Assign Samples
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {assignedSamples.length === 0 ? (
            <Empty className="bg-surface min-h-0 rounded-lg border">
              <EmptyHeader>
                <EmptyTitle className="text-xs">{config.emptyTitle}</EmptyTitle>
                <EmptyDescription className="text-xs">
                  {draft.samples.length === 0
                    ? config.noSamplesDescription
                    : config.emptyDescription}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {assignedSamples.map((sample) => (
                <SampleItem
                  key={sample.id}
                  sample={sample}
                  contentTypeName={
                    contentTypeNames.get(sample.contentTypeId) ?? 'Content Type'
                  }
                  action={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={config.removeLabel}
                      onClick={() => removeAssignment(sample)}
                    >
                      <X />
                    </Button>
                  }
                />
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <AssignSamplesDialog
        open={dialogOpen}
        samples={draft.samples}
        contentTypeNames={contentTypeNames}
        selectedSampleIds={selectedSampleIds}
        submitting={updateSample.isPending}
        description={config.dialogDescription}
        onOpenChange={setDialogOpen}
        onSelectedSampleIdsChange={setSelectedSampleIds}
        onSave={saveAssignments}
      />
    </>
  );
}

type SampleItemProps = {
  sample: BrandKitSample;
  contentTypeName: string;
  action?: ReactNode;
  asLabel?: boolean;
  checkbox?: ReactNode;
};

function SampleItem({
  sample,
  contentTypeName,
  action,
  asLabel = false,
  checkbox,
}: SampleItemProps) {
  return (
    <Item
      asChild={asLabel}
      variant="outline"
      size="sm"
      className={cn('min-w-0 flex-nowrap', asLabel && 'cursor-pointer')}
    >
      {asLabel ? (
        <label>
          {checkbox}
          <SampleItemContent
            sample={sample}
            contentTypeName={contentTypeName}
          />
        </label>
      ) : (
        <>
          <SampleItemContent
            sample={sample}
            contentTypeName={contentTypeName}
          />
          {action && <ItemActions>{action}</ItemActions>}
        </>
      )}
    </Item>
  );
}

function SampleItemContent({
  sample,
  contentTypeName,
}: Pick<SampleItemProps, 'sample' | 'contentTypeName'>) {
  return (
    <>
      <ItemMedia variant="icon" className="text-muted-foreground">
        {sample.kind === 'URL' ? <Link2 /> : <FileText />}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0 text-xs">
          {sample.kind === 'URL' ? (
            <span className="block min-w-0 truncate" title={sample.value}>
              {sample.value}
            </span>
          ) : (
            <span className="line-clamp-2" title={sample.value}>
              {sample.value}
            </span>
          )}
        </ItemTitle>
        <Badge variant="muted" size="sm" className="w-fit">
          {contentTypeName}
        </Badge>
      </ItemContent>
    </>
  );
}

type AssignSamplesDialogProps = {
  open: boolean;
  samples: BrandKitSample[];
  contentTypeNames: Map<string, string>;
  selectedSampleIds: string[];
  submitting: boolean;
  description: string;
  onOpenChange: (open: boolean) => void;
  onSelectedSampleIdsChange: (sampleIds: string[]) => void;
  onSave: (sampleIds: string[]) => Promise<void>;
};

function AssignSamplesDialog({
  open,
  samples,
  contentTypeNames,
  selectedSampleIds,
  submitting,
  description,
  onOpenChange,
  onSelectedSampleIdsChange,
  onSave,
}: AssignSamplesDialogProps) {
  const selected = new Set(selectedSampleIds);

  function toggleSample(sampleId: string, checked: boolean) {
    onSelectedSampleIdsChange(
      checked
        ? [...new Set([...selectedSampleIds, sampleId])]
        : selectedSampleIds.filter((id) => id !== sampleId),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Existing Samples</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ItemGroup className="max-h-[min(28rem,60vh)] gap-2 overflow-y-auto">
            {samples.map((sample) => (
              <SampleItem
                key={sample.id}
                sample={sample}
                contentTypeName={
                  contentTypeNames.get(sample.contentTypeId) ?? 'Content Type'
                }
                asLabel
                checkbox={
                  <Checkbox
                    checked={selected.has(sample.id)}
                    onCheckedChange={(checked) =>
                      toggleSample(sample.id, checked === true)
                    }
                  />
                }
              />
            ))}
          </ItemGroup>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={submitting}
            disabled={submitting}
            onClick={() => onSave(selectedSampleIds)}
          >
            Save Assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getAssignmentConfig(
  draft: ReturnType<typeof useBrandKitDraft>['draft'],
  scope: AssignmentScope,
  scopeId: string,
) {
  if (scope === 'audience') {
    const name =
      draft.audiences.find((item) => item.id === scopeId)?.name ??
      'this audience';
    return {
      title: 'Audience-Specific Samples',
      description: `Use these when an example is only relevant to ${name}. Samples without an audience assignment remain general examples.`,
      emptyTitle: 'No audience-specific samples',
      noSamplesDescription:
        'Add samples to a content type before assigning them to an audience.',
      emptyDescription: 'General samples still apply to this audience.',
      dialogDescription:
        'Select examples whose messaging and level of detail match this audience.',
      removeLabel: 'Remove sample from audience',
      isAssigned: (sample: BrandKitSample) =>
        sample.audienceIds.includes(scopeId),
    };
  }

  const name =
    draft.regions.find((item) => item.id === scopeId)?.name ?? 'this region';
  return {
    title: 'Region-Specific Samples',
    description: `Use these when an example is only relevant to ${name}. Samples without a region assignment remain general examples.`,
    emptyTitle: 'No region-specific samples',
    noSamplesDescription:
      'Add samples to a content type before assigning them to a region.',
    emptyDescription: 'General samples still apply to this region.',
    dialogDescription:
      'Select examples whose language, terminology, or market context matches this region.',
    removeLabel: 'Remove sample from region',
    isAssigned: (sample: BrandKitSample) => sample.regionIds.includes(scopeId),
  };
}

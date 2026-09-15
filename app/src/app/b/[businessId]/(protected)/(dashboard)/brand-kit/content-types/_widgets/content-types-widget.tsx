'use client';

import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import {
  useCreateBrandKitContentType,
  useDeleteBrandKitContentType,
} from '@/features/brand-kit/api/content-types';
import { useCreateContentTypeResearch } from '@/features/brand-kit/api/create-content-type-research';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { usePersistedResearchJobs } from '@/features/brand-kit/hooks/use-persisted-research-jobs';
import type { BrandKitContentType } from '@/features/brand-kit/types';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';

import {
  AddContentTypeDialog,
  type ContentTypeFormValues,
} from '../_components/add-content-type-dialog';
import { ContentTypesTable } from '../_components/content-types-table';

type ContentTypesWidgetProps = {
  businessId: string;
  className?: string;
};

export function ContentTypesWidget({
  businessId,
  className,
}: ContentTypesWidgetProps) {
  const { draft, setDraft } = useBrandKitDraft();
  const createResearch = useCreateContentTypeResearch();
  const createContentType = useCreateBrandKitContentType();
  const deleteContentType = useDeleteBrandKitContentType();
  const confirmDelete = useDeleteConfirmation();
  const [researchJobs, setResearchJobs] = usePersistedResearchJobs(
    businessId,
    'content-type',
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  async function addContentType({ name, sampleUrl }: ContentTypeFormValues) {
    const contentTypeId = crypto.randomUUID();

    if (!sampleUrl) {
      try {
        const { item } = await createContentType.mutateAsync({
          businessId,
          id: contentTypeId,
          name,
        });
        setDraft((previous) => ({
          ...previous,
          contentTypes: [...previous.contentTypes, item],
        }));
        return true;
      } catch (error) {
        toast.error(getBrandKitError(error, 'Could not add content type'));
        return false;
      }
    }

    try {
      const research = await createResearch.mutateAsync({
        businessId,
        requestId: contentTypeId,
        name,
        sampleUrl,
      });
      const workflowRunId = research.workflowRunId;
      if (!workflowRunId) {
        throw new Error('Content type research did not return a workflow run');
      }

      setResearchJobs((previous) =>
        previous.some((job) => job.workflowRunId === workflowRunId)
          ? previous
          : [...previous, { workflowRunId, name }],
      );
      return true;
    } catch (error) {
      toast.error(
        getBrandKitError(error, 'Could not start analyzing this content type'),
      );
      return false;
    }
  }

  const removeResearchJob = useCallback(
    (workflowRunId: string) => {
      setResearchJobs((previous) =>
        previous.filter((job) => job.workflowRunId !== workflowRunId),
      );
    },
    [setResearchJobs],
  );

  async function removeContentType(contentTypeId: string) {
    await deleteContentType.mutateAsync({ businessId, contentTypeId });
    setDraft((previous) => ({
      ...previous,
      contentTypes: previous.contentTypes.filter(
        (contentType) => contentType.id !== contentTypeId,
      ),
      rules: previous.rules.filter(
        (rule) => rule.contentTypeId !== contentTypeId,
      ),
      samples: previous.samples.filter(
        (sample) => sample.contentTypeId !== contentTypeId,
      ),
    }));
  }

  function handleDelete(contentType: BrandKitContentType) {
    confirmDelete({
      title: 'Delete content type?',
      description: `Are you sure you want to delete “${contentType.name}”? Its call to action, writing rules, and samples will also be deleted. This action cannot be undone.`,
      confirmLabel: 'Delete content type',
      onConfirm: () => removeContentType(contentType.id),
    });
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Content Types</CardTitle>
          <CardDescription>
            Define the formats you create. Each one can have its own call to
            action, writing rules, and samples.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus />
              Add Content Type
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ContentTypesTable
            businessId={businessId}
            contentTypes={draft.contentTypes}
            samples={draft.samples}
            researchJobs={researchJobs}
            onResearchFinished={removeResearchJob}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <AddContentTypeDialog
        open={dialogOpen}
        submitting={createResearch.isPending || createContentType.isPending}
        onOpenChange={setDialogOpen}
        onAdd={addContentType}
      />
    </>
  );
}

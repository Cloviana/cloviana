'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { paths } from '@/config/paths';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import {
  useCreateBrandKitRegion,
  useDeleteBrandKitRegion,
} from '@/features/brand-kit/api/regions';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type { BrandKitRegion } from '@/features/brand-kit/types';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';

const regionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(2_000, 'Description must be 2,000 characters or fewer'),
});

type RegionFormValues = z.infer<typeof regionFormSchema>;

type RegionsWidgetProps = {
  businessId: string;
  className?: string;
};

export function RegionsWidget({ businessId, className }: RegionsWidgetProps) {
  const { draft, setDraft } = useBrandKitDraft();
  const router = useRouter();
  const createRegion = useCreateBrandKitRegion();
  const deleteRegion = useDeleteBrandKitRegion();
  const confirmDelete = useDeleteConfirmation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionFormSchema),
    mode: 'onSubmit',
    defaultValues: { name: '', description: '' },
  });

  function handleDialogOpenChange(open: boolean) {
    if (!open && createRegion.isPending) return;
    if (!open) form.reset();
    setDialogOpen(open);
  }

  async function addRegion(values: RegionFormValues) {
    try {
      const { item } = await createRegion.mutateAsync({
        businessId,
        id: crypto.randomUUID(),
        name: values.name,
        description: values.description || null,
      });
      setDraft((previous) => ({
        ...previous,
        regions: [...previous.regions, item],
      }));
      handleDialogOpenChange(false);
      router.push(
        paths.business.brandKit.regions.detail.getHref(businessId, item.id),
      );
    } catch (error) {
      toast.error(getBrandKitError(error, 'Could not add region'));
    }
  }

  async function removeRegion(regionId: string) {
    await deleteRegion.mutateAsync({ businessId, regionId });
    setDraft((previous) => ({
      ...previous,
      regions: previous.regions.filter((region) => region.id !== regionId),
      rules: previous.rules.filter((rule) => rule.regionId !== regionId),
      samples: previous.samples.map((sample) => ({
        ...sample,
        regionIds: sample.regionIds.filter((id) => id !== regionId),
      })),
    }));
  }

  function handleDelete(region: BrandKitRegion) {
    confirmDelete({
      title: 'Delete region?',
      description: `Are you sure you want to delete “${region.name}”? Its rules and sample assignments will also be removed. This action cannot be undone.`,
      confirmLabel: 'Delete region',
      onConfirm: () => removeRegion(region.id),
    });
  }

  const nameError = form.formState.errors.name?.message;
  const descriptionError = form.formState.errors.description?.message;

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Regions</CardTitle>
          <CardDescription>
            Define markets that need localized language, rules, or samples. Skip
            this if your content does not vary by market.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus />
              Add Region
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TableFrame variant="bordered">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[32%]">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-14 px-2">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.regions.map((region) => {
                  const detailHref =
                    paths.business.brandKit.regions.detail.getHref(
                      businessId,
                      region.id,
                    );

                  return (
                    <TableRow
                      key={region.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() => router.push(detailHref)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') router.push(detailHref);
                      }}
                    >
                      <TableCell className="text-xs font-medium whitespace-normal">
                        {region.name}
                      </TableCell>
                      <TableCell className="text-xs whitespace-normal">
                        <p className="line-clamp-2">
                          {region.description || '-'}
                        </p>
                      </TableCell>
                      <TableCell
                        className="w-14 px-2"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${region.name}`}
                          onClick={() => handleDelete(region)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {draft.regions.length === 0 && (
              <Empty className="bg-surface min-h-0 rounded-none">
                <EmptyHeader>
                  <EmptyTitle className="text-xs">No regions yet</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Add a region when content needs to change for a specific
                    market.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </TableFrame>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Region</DialogTitle>
            <DialogDescription>
              Create reusable localization context for playbooks and content.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form id="add-region-form" onSubmit={form.handleSubmit(addRegion)}>
              <FieldGroup>
                <Field data-invalid={Boolean(nameError)}>
                  <FieldLabel htmlFor="add-region-name">Name</FieldLabel>
                  <Input
                    id="add-region-name"
                    placeholder="e.g. United Kingdom"
                    maxLength={200}
                    autoFocus
                    aria-invalid={Boolean(nameError)}
                    {...form.register('name')}
                  />
                  <FieldError>{nameError}</FieldError>
                </Field>

                <Field data-invalid={Boolean(descriptionError)}>
                  <FieldLabel htmlFor="add-region-description">
                    Regional Context
                  </FieldLabel>
                  <Textarea
                    id="add-region-description"
                    rows={6}
                    maxLength={2_000}
                    placeholder="Describe the market, language, terminology, spelling, and any local considerations."
                    aria-invalid={Boolean(descriptionError)}
                    {...form.register('description')}
                  />
                  <FieldDescription>
                    Use this context to localize language and examples for this
                    market.
                  </FieldDescription>
                  <FieldError>{descriptionError}</FieldError>
                </Field>
              </FieldGroup>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button
              type="submit"
              form="add-region-form"
              loading={createRegion.isPending}
              disabled={createRegion.isPending}
            >
              <Plus />
              Add Region
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

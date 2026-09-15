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
import {
  useCreateBrandKitAudience,
  useDeleteBrandKitAudience,
} from '@/features/brand-kit/api/audiences';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type { BrandKitAudience } from '@/features/brand-kit/types';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';

const audienceFormSchema = z.object({
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

type AudienceFormValues = z.infer<typeof audienceFormSchema>;

type AudiencesWidgetProps = {
  businessId: string;
  className?: string;
};

export function AudiencesWidget({
  businessId,
  className,
}: AudiencesWidgetProps) {
  const { draft, setDraft } = useBrandKitDraft();
  const router = useRouter();
  const createAudience = useCreateBrandKitAudience();
  const deleteAudience = useDeleteBrandKitAudience();
  const confirmDelete = useDeleteConfirmation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<AudienceFormValues>({
    resolver: zodResolver(audienceFormSchema),
    mode: 'onSubmit',
    defaultValues: { name: '', description: '' },
  });

  function handleDialogOpenChange(open: boolean) {
    if (!open && createAudience.isPending) return;
    if (!open) form.reset();
    setDialogOpen(open);
  }

  async function addAudience(values: AudienceFormValues) {
    try {
      const { item } = await createAudience.mutateAsync({
        businessId,
        id: crypto.randomUUID(),
        name: values.name,
        description: values.description || null,
      });
      setDraft((previous) => ({
        ...previous,
        audiences: [...previous.audiences, item],
      }));
      handleDialogOpenChange(false);
      router.push(
        paths.business.brandKit.audiences.detail.getHref(businessId, item.id),
      );
    } catch (error) {
      toast.error(getBrandKitError(error, 'Could not add audience'));
    }
  }

  async function removeAudience(audienceId: string) {
    await deleteAudience.mutateAsync({ businessId, audienceId });
    setDraft((previous) => ({
      ...previous,
      audiences: previous.audiences.filter(
        (audience) => audience.id !== audienceId,
      ),
      rules: previous.rules.filter((rule) => rule.audienceId !== audienceId),
      samples: previous.samples.map((sample) => ({
        ...sample,
        audienceIds: sample.audienceIds.filter((id) => id !== audienceId),
      })),
    }));
  }

  function handleDelete(audience: BrandKitAudience) {
    confirmDelete({
      title: 'Delete audience?',
      description: `Are you sure you want to delete “${audience.name}”? Its rules and sample assignments will also be removed. This action cannot be undone.`,
      confirmLabel: 'Delete audience',
      onConfirm: () => removeAudience(audience.id),
    });
  }

  const nameError = form.formState.errors.name?.message;
  const descriptionError = form.formState.errors.description?.message;

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Audiences</CardTitle>
          <CardDescription>
            Define who your content is for. Each audience can have its own
            context, writing rules, and samples.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus />
              Add Audience
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
                {draft.audiences.map((audience) => {
                  const detailHref =
                    paths.business.brandKit.audiences.detail.getHref(
                      businessId,
                      audience.id,
                    );

                  return (
                    <TableRow
                      key={audience.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() => router.push(detailHref)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') router.push(detailHref);
                      }}
                    >
                      <TableCell className="text-xs font-medium whitespace-normal">
                        {audience.name}
                      </TableCell>
                      <TableCell className="text-xs whitespace-normal">
                        <p className="line-clamp-2">
                          {audience.description || '-'}
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
                          aria-label={`Delete ${audience.name}`}
                          onClick={() => handleDelete(audience)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {draft.audiences.length === 0 && (
              <Empty className="bg-surface min-h-0 rounded-none">
                <EmptyHeader>
                  <EmptyTitle className="text-xs">No audiences yet</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Add an audience when content should be tailored to a
                    specific type of reader.
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
            <DialogTitle>Add Audience</DialogTitle>
            <DialogDescription>
              Create reusable reader context for playbooks and content.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form
              id="add-audience-form"
              onSubmit={form.handleSubmit(addAudience)}
            >
              <FieldGroup>
                <Field data-invalid={Boolean(nameError)}>
                  <FieldLabel htmlFor="add-audience-name">Name</FieldLabel>
                  <Input
                    id="add-audience-name"
                    placeholder="e.g. B2B SaaS founders"
                    maxLength={200}
                    autoFocus
                    aria-invalid={Boolean(nameError)}
                    {...form.register('name')}
                  />
                  <FieldError>{nameError}</FieldError>
                </Field>

                <Field data-invalid={Boolean(descriptionError)}>
                  <FieldLabel htmlFor="add-audience-description">
                    Audience Definition
                  </FieldLabel>
                  <Textarea
                    id="add-audience-description"
                    rows={6}
                    maxLength={2_000}
                    placeholder="Describe who they are, what they want to achieve, their pain points, and the language they use."
                    aria-invalid={Boolean(descriptionError)}
                    {...form.register('description')}
                  />
                  <FieldDescription>
                    Use this context to tailor messaging, terminology, and level
                    of detail.
                  </FieldDescription>
                  <FieldError>{descriptionError}</FieldError>
                </Field>
              </FieldGroup>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button
              type="submit"
              form="add-audience-form"
              loading={createAudience.isPending}
              disabled={createAudience.isPending}
            >
              <Plus />
              Add Audience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

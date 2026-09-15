'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

const FORM_ID = 'add-content-type-form';

const contentTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Content type name is required')
    .max(200, 'Content type name must be 200 characters or fewer'),
  sampleUrl: z
    .string()
    .trim()
    .max(2_000, 'Sample URL must be 2,000 characters or fewer')
    .refine((value) => {
      if (!value) return true;

      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && Boolean(url.host);
      } catch {
        return false;
      }
    }, 'Enter a valid URL beginning with http or https'),
});

export type ContentTypeFormValues = z.infer<typeof contentTypeFormSchema>;

type AddContentTypeDialogProps = {
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (values: ContentTypeFormValues) => Promise<boolean>;
};

export function AddContentTypeDialog({
  open,
  submitting,
  onOpenChange,
  onAdd,
}: AddContentTypeDialogProps) {
  const form = useForm<ContentTypeFormValues>({
    resolver: zodResolver(contentTypeFormSchema),
    mode: 'onSubmit',
    defaultValues: { name: '', sampleUrl: '' },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  }

  async function submit(values: ContentTypeFormValues) {
    if (await onAdd(values)) handleOpenChange(false);
  }

  const nameError = form.formState.errors.name?.message;
  const sampleUrlError = form.formState.errors.sampleUrl?.message;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Content Type</DialogTitle>
          <DialogDescription>
            Set up a reusable format for playbooks and content.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id={FORM_ID}
            className="py-2"
            onSubmit={form.handleSubmit(submit)}
          >
            <FieldGroup className="gap-5">
              <Field data-invalid={Boolean(nameError)}>
                <FieldLabel htmlFor="add-content-type-name">Name</FieldLabel>
                <Input
                  id="add-content-type-name"
                  placeholder="e.g. Blog Post"
                  autoFocus
                  aria-invalid={Boolean(nameError)}
                  {...form.register('name')}
                />
                <FieldError>{nameError}</FieldError>
              </Field>

              <Field data-invalid={Boolean(sampleUrlError)}>
                <FieldLabel htmlFor="add-content-type-sample-url">
                  Example URL
                  <span className="text-muted-foreground">(Optional)</span>
                </FieldLabel>
                <InputGroup aria-invalid={Boolean(sampleUrlError)}>
                  <InputGroupAddon>
                    <Link2 />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="add-content-type-sample-url"
                    type="url"
                    placeholder="https://example.com/blog/example-post"
                    aria-invalid={Boolean(sampleUrlError)}
                    {...form.register('sampleUrl')}
                  />
                </InputGroup>
                <FieldDescription>
                  Cloviana will research the format and default call to action.
                </FieldDescription>
                <FieldError>{sampleUrlError}</FieldError>
              </Field>
            </FieldGroup>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={submitting}
            loading={submitting}
          >
            <Plus />
            Add Content Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

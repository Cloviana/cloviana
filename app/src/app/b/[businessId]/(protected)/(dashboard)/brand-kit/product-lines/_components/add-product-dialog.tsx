'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
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
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const FORM_ID = 'add-product-form';

const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(120, 'Product name must be 120 characters or fewer'),
  contextUrl: z
    .string()
    .trim()
    .max(2_000, 'Product page URL must be 2,000 characters or fewer')
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

export type ProductFormValues = z.infer<typeof productFormSchema>;

type AddProductDialogProps = {
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (values: ProductFormValues) => Promise<boolean>;
};

export function AddProductDialog({
  open,
  submitting,
  onOpenChange,
  onAdd,
}: AddProductDialogProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: 'onSubmit',
    defaultValues: { name: '', contextUrl: '' },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  }

  async function submit(values: ProductFormValues) {
    if (await onAdd(values)) handleOpenChange(false);
  }

  const nameError = form.formState.errors.name?.message;
  const contextUrlError = form.formState.errors.contextUrl?.message;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Add the product manually or provide a page for Cloviana to research.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id={FORM_ID}
            className="space-y-4"
            onSubmit={form.handleSubmit(submit)}
          >
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="add-product-name">Product Name</FieldLabel>
              <Input
                id="add-product-name"
                placeholder="e.g. Analytics Platform"
                maxLength={120}
                aria-invalid={Boolean(nameError)}
                autoFocus
                {...form.register('name')}
              />
              <FieldError>{nameError}</FieldError>
            </Field>

            <Field data-invalid={Boolean(contextUrlError)}>
              <FieldLabel htmlFor="add-product-context-url">
                Product Page URL
                <span className="text-muted-foreground">(Optional)</span>
              </FieldLabel>
              <Input
                id="add-product-context-url"
                type="url"
                placeholder="https://example.com/products/analytics"
                maxLength={2_000}
                aria-invalid={Boolean(contextUrlError)}
                {...form.register('contextUrl')}
              />
              <FieldDescription>
                Cloviana will research its details, positioning, ideal customer
                profile, and competitors.
              </FieldDescription>
              <FieldError>{contextUrlError}</FieldError>
            </Field>
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
            Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

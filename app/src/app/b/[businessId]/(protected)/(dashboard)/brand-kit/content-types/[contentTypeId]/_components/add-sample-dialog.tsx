'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, Plus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox';
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import type {
  BrandKitAudience,
  BrandKitRegion,
} from '@/features/brand-kit/types';

const FORM_ID = 'add-content-type-sample-form';

const sampleFormSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, 'Sample URL is required')
    .max(2_000, 'Sample URL must be 2,000 characters or fewer')
    .refine((value) => {
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && Boolean(url.host);
      } catch {
        return false;
      }
    }, 'Enter a valid URL beginning with http or https'),
  audienceIds: z.array(z.string()),
  regionIds: z.array(z.string()),
});

export type SampleFormValues = z.infer<typeof sampleFormSchema>;

type AddSampleDialogProps = {
  open: boolean;
  audiences: BrandKitAudience[];
  regions: BrandKitRegion[];
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (values: SampleFormValues) => Promise<boolean>;
};

export function AddSampleDialog({
  open,
  audiences,
  regions,
  submitting,
  onOpenChange,
  onAdd,
}: AddSampleDialogProps) {
  const audienceAnchor = useComboboxAnchor();
  const regionAnchor = useComboboxAnchor();
  const form = useForm<SampleFormValues>({
    resolver: zodResolver(sampleFormSchema),
    mode: 'onSubmit',
    defaultValues: { value: '', audienceIds: [], regionIds: [] },
  });
  const audienceIds = useWatch({ control: form.control, name: 'audienceIds' });
  const regionIds = useWatch({ control: form.control, name: 'regionIds' });
  const selectedAudiences = audiences.filter((audience) =>
    audienceIds.includes(audience.id),
  );
  const selectedRegions = regions.filter((region) =>
    regionIds.includes(region.id),
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submitting) return;
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  }

  async function submit(values: SampleFormValues) {
    if (await onAdd(values)) handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Sample</DialogTitle>
          <DialogDescription>
            Add a published example as a style and format reference, not as a
            source of facts.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={FORM_ID} onSubmit={form.handleSubmit(submit)}>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.value)}>
                <FieldLabel htmlFor="content-type-sample-url">
                  Sample URL
                </FieldLabel>
                <InputGroup aria-invalid={Boolean(form.formState.errors.value)}>
                  <InputGroupAddon>
                    <Link2 />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="content-type-sample-url"
                    type="url"
                    placeholder="https://example.com/blog/sample-post"
                    autoFocus
                    aria-invalid={Boolean(form.formState.errors.value)}
                    {...form.register('value')}
                  />
                </InputGroup>
                <FieldError>{form.formState.errors.value?.message}</FieldError>
              </Field>

              <AssignmentField
                id="content-type-sample-audiences"
                label="Audiences"
                placeholder="Select audiences..."
                emptyMessage="No audiences found."
                description="Leave empty if this sample works for every audience. Select audiences only when the example is audience-specific."
                items={audiences}
                selectedItems={selectedAudiences}
                anchor={audienceAnchor}
                onChange={(items) =>
                  form.setValue(
                    'audienceIds',
                    items.map((item) => item.id),
                  )
                }
              />

              <AssignmentField
                id="content-type-sample-regions"
                label="Regions"
                placeholder="Select regions..."
                emptyMessage="No regions found."
                description="Leave empty if this sample works for every region. Select regions only when the example is market-specific."
                items={regions}
                selectedItems={selectedRegions}
                anchor={regionAnchor}
                onChange={(items) =>
                  form.setValue(
                    'regionIds',
                    items.map((item) => item.id),
                  )
                }
              />
            </FieldGroup>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            type="submit"
            form={FORM_ID}
            loading={submitting}
            disabled={submitting}
          >
            <Plus />
            Add Sample
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AssignmentItem = { id: string; name: string };

type AssignmentFieldProps<TItem extends AssignmentItem> = {
  id: string;
  label: string;
  placeholder: string;
  emptyMessage: string;
  description: string;
  items: TItem[];
  selectedItems: TItem[];
  anchor: ReturnType<typeof useComboboxAnchor>;
  onChange: (items: TItem[]) => void;
};

function AssignmentField<TItem extends AssignmentItem>({
  id,
  label,
  placeholder,
  emptyMessage,
  description,
  items,
  selectedItems,
  anchor,
  onChange,
}: AssignmentFieldProps<TItem>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label} <span className="text-muted-foreground">(Optional)</span>
      </FieldLabel>
      <Combobox
        multiple
        items={items}
        value={selectedItems}
        onValueChange={onChange}
        itemToStringLabel={(item: TItem) => item.name}
        isItemEqualToValue={(item: TItem, value: TItem) => item.id === value.id}
      >
        <ComboboxChips ref={anchor}>
          {selectedItems.map((item) => (
            <ComboboxChip key={item.id}>{item.name}</ComboboxChip>
          ))}
          <ComboboxChipsInput
            id={id}
            placeholder={selectedItems.length === 0 ? placeholder : undefined}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor} className="z-[60]">
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item: TItem) => (
              <ComboboxItem key={item.id} value={item}>
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

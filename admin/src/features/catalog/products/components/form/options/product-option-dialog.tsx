'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { XIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
} from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
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

import { productFormSchema } from '../../../schemas/product.schema';
import type { ProductFormValues } from '../use-product-form';

export type ProductOption = NonNullable<ProductFormValues['options']>[number];
type OptionValue = { key: string; value: string; persistedId: string | null };
type OptionErrors = { name?: string; values?: string; form?: string };

export function ProductOptionDialog({
  option,
  index,
  onSave,
  onClose,
}: {
  option: ProductOption;
  index?: number;
  onSave: (option: ProductOption) => void;
  onClose: () => void;
}) {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const { getValues } = useFormContext<ProductFormValues>();
  const [name, setName] = useState(option.name);
  const [values, setValues] = useState<OptionValue[]>(() =>
    option.values.map((value, position) => ({
      key: option.valueKeys?.[position] ?? crypto.randomUUID(),
      value,
      persistedId: option.valueIds?.[position] ?? null,
    })),
  );
  const [input, setInput] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<OptionErrors>({});

  function getEntries() {
    const value = input.trim();
    if (!value && !editingKey) return values;
    const duplicate = values.some(
      (entry) =>
        entry.key !== editingKey &&
        entry.value.toLowerCase() === value.toLowerCase(),
    );
    if (!value || duplicate) {
      setErrors((current) => ({
        ...current,
        values: duplicate ? 'Option values must be unique.' : 'Enter a value.',
      }));
      valueRef.current?.focus();
      return null;
    }
    return editingKey
      ? values.map((entry) =>
          entry.key === editingKey ? { ...entry, value } : entry,
        )
      : [...values, { key: crypto.randomUUID(), value, persistedId: null }];
  }

  function addValue() {
    const next = getEntries();
    if (!next) return;
    setValues(next);
    setInput('');
    setEditingKey(null);
    setErrors((current) => ({ ...current, values: undefined }));
    valueRef.current?.focus();
  }

  function editValue(entry: OptionValue) {
    const next = getEntries();
    if (!next) return;
    setValues(next);
    setEditingKey(entry.key);
    setInput(next.find((item) => item.key === entry.key)?.value ?? entry.value);
    valueRef.current?.focus();
    requestAnimationFrame(() => valueRef.current?.select());
  }

  function save() {
    const entries = getEntries();
    if (!entries) return;
    const next: ProductOption = {
      ...option,
      name: name.trim(),
      values: entries.map((entry) => entry.value.trim()),
      valueKeys: entries.map((entry) => entry.key),
      valueIds: entries.map((entry) => entry.persistedId),
    };
    const current = getValues('options') ?? [];
    const result = productFormSchema.shape.options.safeParse(
      index === undefined
        ? [...current, next]
        : current.map((entry, position) => (position === index ? next : entry)),
    );

    if (!result.success) {
      const nextErrors: OptionErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[1];
        if (field === 'name' || field === 'values')
          nextErrors[field] ??= issue.message;
        else nextErrors.form ??= issue.message;
      }
      setErrors(nextErrors);
      if (nextErrors.name) nameRef.current?.focus();
      else valueRef.current?.focus();
      return;
    }
    onSave(next);
  }

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        ref={popupRef}
        className="flex max-h-[calc(100dvh-(--spacing(8)))] flex-col sm:max-w-md"
        // Focus the dialog itself, not its first field.
        initialFocus={popupRef}
      >
        <DialogHeader>
          <DialogTitle>
            {index === undefined ? 'Add option' : 'Edit option'}
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            save();
          }}
        >
          <div className="-m-1 min-h-0 space-y-4 overflow-y-auto p-1">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor={`${id}-name`} required>
                Option name
              </FieldLabel>
              <Input
                ref={nameRef}
                id={`${id}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={255}
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={`${id}-name-help${errors.name ? ` ${id}-name-error` : ''}`}
              />
              <FieldDescription id={`${id}-name-help`}>
                For example, size or colour.
              </FieldDescription>
              <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.values)}>
              <FieldLabel htmlFor={`${id}-values`} required>
                Option values
              </FieldLabel>
              <Combobox
                multiple
                open={false}
                items={values}
                value={values}
                inputValue={input}
                itemToStringLabel={(entry) => entry.value}
                itemToStringValue={(entry) => entry.key}
                isItemEqualToValue={(first, second) => first.key === second.key}
                onInputValueChange={(value, details) => {
                  if (
                    details.reason === 'input-change' ||
                    details.reason === 'input-clear'
                  )
                    setInput(value);
                  else details.cancel();
                }}
                onValueChange={(next) => {
                  setValues(next);
                  if (
                    editingKey &&
                    !next.some((entry) => entry.key === editingKey)
                  ) {
                    setEditingKey(null);
                    setInput('');
                  }
                }}
              >
                <ComboboxChips
                  aria-label="Option values"
                  className="flex-col items-stretch rounded-md px-2 has-data-[slot=combobox-chip]:px-2"
                >
                  {values.length > 0 && (
                    <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto overscroll-contain">
                      <ComboboxValue>
                        {values.map((entry) => (
                          <ComboboxChip
                            key={entry.key}
                            showRemove={false}
                            className="max-w-full"
                            aria-description="Press Enter to edit. Press Backspace or Delete to remove."
                            onKeyDown={(event) => {
                              if (
                                event.key === 'Enter' &&
                                event.target === event.currentTarget
                              ) {
                                event.preventDefault();
                                editValue(entry);
                              }
                            }}
                          >
                            <button
                              type="button"
                              className="focus-visible:ring-border-focused min-w-0 truncate rounded-sm text-left outline-none focus-visible:ring-(length:--ds-border-width-focused)"
                              aria-label={`Edit value ${entry.value}`}
                              onClick={() => editValue(entry)}
                            >
                              {entry.value}
                            </button>
                            <ComboboxPrimitive.ChipRemove
                              aria-label={`Remove value ${entry.value}`}
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                />
                              }
                            >
                              <XIcon aria-hidden="true" />
                            </ComboboxPrimitive.ChipRemove>
                          </ComboboxChip>
                        ))}
                      </ComboboxValue>
                    </div>
                  )}
                  <ComboboxChipsInput
                    ref={valueRef}
                    id={`${id}-values`}
                    className="min-h-6 w-full flex-none"
                    maxLength={255}
                    aria-invalid={Boolean(errors.values)}
                    aria-describedby={`${id}-values-help${errors.values ? ` ${id}-values-error` : ''}`}
                    aria-description="Press the left arrow at the start of the input to reach the values."
                    onKeyDownCapture={(event) => {
                      if (event.nativeEvent.isComposing) return;
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        addValue();
                      } else if (
                        event.key === 'Escape' &&
                        (editingKey || input)
                      ) {
                        event.preventDefault();
                        event.stopPropagation();
                        setEditingKey(null);
                        setInput('');
                      }
                    }}
                  />
                </ComboboxChips>
              </Combobox>
              <p
                id={`${id}-values-help`}
                className="text-body-small text-text-subtlest"
              >
                Enter to add. Click a value to edit.
              </p>
              <FieldError id={`${id}-values-error`}>{errors.values}</FieldError>
            </Field>
            <FieldError>{errors.form}</FieldError>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {index === undefined ? 'Add option' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

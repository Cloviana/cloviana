'use client';

import { useEffect, useId, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
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
  InputGroupText,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';

import type { ProductFormValues } from './use-product-form';

export function SearchEngineListing({
  pageTitle,
  setPageTitle,
  metaDescription,
  setMetaDescription,
}: {
  pageTitle: string | null;
  setPageTitle: (value: string) => void;
  metaDescription: string;
  setMetaDescription: (value: string) => void;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();
  const id = useId();
  const title = useWatch({ control, name: 'title' });
  const handle = useWatch({ control, name: 'handle' });
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (errors.handle) setEditing(true);
  }, [errors.handle]);
  const currentTitle = pageTitle ?? (title ?? '').slice(0, 70);
  const currentHandle = handle?.trim() || 'new-product';

  return (
    <div
      role="group"
      aria-label="Example search engine listing"
      className="flex flex-col gap-4"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-surface-sunken size-6 shrink-0 rounded-full"
            />
            <div className="min-w-0">
              <p className="text-body text-text-default">Example store</p>
              <p className="text-body-small text-text-subtlest break-words">
                your-store.com › products › {currentHandle}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={editing}
            aria-controls={`${id}-fields`}
            onClick={() => setEditing((current) => !current)}
          >
            {editing ? 'Done' : 'Edit'}
          </Button>
        </div>
        <p className="text-heading-medium text-link-default font-normal break-words">
          {currentTitle.trim() || title?.trim() || 'Product title'}
        </p>
        {metaDescription.trim() && (
          <p className="text-body text-text-subtle break-words">
            {metaDescription}
          </p>
        )}
      </div>
      {editing && (
        <div
          id={`${id}-fields`}
          className="border-t-line border-border-default pt-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${id}-title`}>Page title</FieldLabel>
              <Input
                id={`${id}-title`}
                value={currentTitle}
                maxLength={70}
                aria-describedby={`${id}-title-help ${id}-title-count`}
                onChange={(event) => setPageTitle(event.target.value)}
              />
              <FieldDescription id={`${id}-title-help`}>
                The title intended for search results. Uses the product title by
                default.
              </FieldDescription>
              <FieldDescription id={`${id}-title-count`}>
                {currentTitle.length} of 70 characters used
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-description`}>
                Meta description
              </FieldLabel>
              <Textarea
                id={`${id}-description`}
                value={metaDescription}
                maxLength={160}
                rows={3}
                aria-describedby={`${id}-description-count`}
                onChange={(event) => setMetaDescription(event.target.value)}
              />
              <FieldDescription id={`${id}-description-count`}>
                {metaDescription.length} of 160 characters used
              </FieldDescription>
            </Field>
            <Controller
              control={control}
              name="handle"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-handle`}>URL handle</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>products/</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      id={`${id}-handle`}
                      value={field.value ?? ''}
                      maxLength={120}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={`${id}-url${fieldState.invalid ? ` ${id}-handle-error` : ''}`}
                    />
                  </InputGroup>
                  <FieldDescription id={`${id}-url`}>
                    Use lowercase letters, numbers and hyphens. Example:
                    your-store.com/products/{currentHandle}
                  </FieldDescription>
                  <FieldError
                    id={`${id}-handle-error`}
                    errors={[fieldState.error]}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

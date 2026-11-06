'use client';

import type { RefObject } from 'react';
import { type Control, Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { CategoryPicker } from '../category-picker/category-picker';

// The fields every category form has. The add and edit forms carry more, so a form's control is accepted for any
// value type that includes these, and read as exactly these inside.
type CategoryFieldValues = {
  name: string;
  parentId?: string | null;
  description?: string | null;
};

type CategoryControl<T extends CategoryFieldValues> = Control<T, unknown, any>;

const fieldsOf = <T extends CategoryFieldValues>(control: CategoryControl<T>) =>
  control as unknown as Control<CategoryFieldValues>;

export function CategoryNameField<T extends CategoryFieldValues>({
  control,
  id,
  nameRef,
}: {
  control: CategoryControl<T>;
  id: string;
  nameRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <Controller
      control={fieldsOf(control)}
      name="name"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${id}-name`} required>
            Name
          </FieldLabel>
          <Input
            {...field}
            ref={(element) => {
              field.ref(element);
              if (nameRef) nameRef.current = element;
            }}
            id={`${id}-name`}
            maxLength={100}
            required
            aria-invalid={fieldState.invalid}
            aria-describedby={
              fieldState.invalid ? `${id}-name-error` : undefined
            }
          />
          <FieldError id={`${id}-name-error`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** The parent picker lists inactive and internal categories too, so any category can be a parent. */
export function CategoryParentField<T extends CategoryFieldValues>({
  control,
  id,
  slug,
}: {
  control: CategoryControl<T>;
  id: string;
  slug: string;
}) {
  return (
    <Controller
      control={fieldsOf(control)}
      name="parentId"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${id}-parent`}>Parent category</FieldLabel>
          <CategoryPicker
            slug={slug}
            ref={field.ref}
            id={`${id}-parent`}
            value={field.value ?? null}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="Choose a parent category"
            includeHidden
            aria-invalid={fieldState.invalid}
            aria-describedby={`${id}-parent-help${fieldState.invalid ? ` ${id}-parent-error` : ''}`}
          />
          <FieldDescription id={`${id}-parent-help`}>
            Leave empty for a top-level category.
            {field.value && (
              <>
                {' '}
                <Button
                  type="button"
                  variant="link"
                  size="inline"
                  onClick={() => field.onChange(null)}
                >
                  Clear parent category
                </Button>
              </>
            )}
          </FieldDescription>
          <FieldError id={`${id}-parent-error`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function CategoryDescriptionField<T extends CategoryFieldValues>({
  control,
  id,
}: {
  control: CategoryControl<T>;
  id: string;
}) {
  return (
    <Controller
      control={fieldsOf(control)}
      name="description"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
          <Textarea
            {...field}
            value={field.value ?? ''}
            id={`${id}-description`}
            maxLength={1000}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              fieldState.invalid ? `${id}-description-error` : undefined
            }
          />
          <FieldError
            id={`${id}-description-error`}
            errors={[fieldState.error]}
          />
        </Field>
      )}
    />
  );
}

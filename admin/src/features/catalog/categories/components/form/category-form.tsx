'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { UnsavedChangesBar } from '@/components/forms/unsaved-changes-bar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldSetCard,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { updateCategoryAction } from '../../actions/update-category';
import { categoryKeys } from '../../queries';
import {
  updateCategoryFormSchema,
  type UpdateCategoryFormInput,
  type UpdateCategoryFormValues,
} from '../../schemas/update-category.schema';
import type { Category } from '../../types';

import {
  CategoryDescriptionField,
  CategoryNameField,
  CategoryParentField,
} from './category-fields';

function formValues(category: Category): UpdateCategoryFormInput {
  return {
    name: category.name,
    handle: category.handle,
    parentId: category.parentId,
    description: category.description ?? '',
    isActive: category.isActive,
    isInternal: category.isInternal,
  };
}

/** The category's settings. Changes are saved from the unsaved-changes bar, as on the product page. */
export function CategoryForm({
  slug,
  category,
}: {
  slug: string;
  category: Category;
}) {
  const id = useId();
  const formId = `${id}-form`;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(category);
  const form = useForm<
    UpdateCategoryFormInput,
    unknown,
    UpdateCategoryFormValues
  >({
    resolver: zodResolver(updateCategoryFormSchema),
    mode: 'onSubmit',
    defaultValues: formValues(category),
  });
  const { isDirty } = form.formState;

  const save = useMutation({
    mutationFn: (values: UpdateCategoryFormValues) =>
      updateCategoryAction(slug, saved.id, {
        ...values,
        expectedUpdatedAt: saved.updatedAt,
      }),
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSaved(result.category);
      form.reset(formValues(result.category));
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all(slug) });
      toast.success('Category saved.');
      // The breadcrumbs and the page's own data come from the server.
      router.refresh();
    },
    onError: () =>
      toast.error('Could not save the category. Please try again.'),
  });

  return (
    <form
      id={formId}
      className="flex flex-col gap-8"
      noValidate
      onSubmit={form.handleSubmit(
        (values) => save.mutate(values),
        () => toast.error('Check the highlighted fields and try again.'),
      )}
    >
      <UnsavedChangesBar
        open={isDirty}
        form={formId}
        onDiscard={() => form.reset(formValues(saved))}
        isSaving={save.isPending}
      />
      <FieldSet aria-label="Category details">
        <FieldSetCard>
          <FieldGroup>
            <CategoryNameField control={form.control} id={id} />
            <Controller
              control={form.control}
              name="handle"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-handle`} required>
                    URL handle
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${id}-handle`}
                    maxLength={120}
                    required
                    aria-invalid={fieldState.invalid}
                    aria-describedby={`${id}-handle-help${fieldState.invalid ? ` ${id}-handle-error` : ''}`}
                  />
                  <FieldDescription id={`${id}-handle-help`}>
                    Changing it changes this category's URL.
                  </FieldDescription>
                  <FieldError
                    id={`${id}-handle-error`}
                    errors={[fieldState.error]}
                  />
                </Field>
              )}
            />
            <CategoryParentField control={form.control} id={id} slug={slug} />
            <CategoryDescriptionField control={form.control} id={id} />
          </FieldGroup>
        </FieldSetCard>
      </FieldSet>
      <FieldSet>
        <FieldLegend variant="section">Visibility</FieldLegend>
        <FieldSetCard>
          <FieldGroup>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={`${id}-active`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={`${id}-active`}>Active</FieldLabel>
                    <FieldDescription>
                      Inactive categories are hidden from the product form and
                      your storefront.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="isInternal"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={`${id}-internal`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={`${id}-internal`}>Internal</FieldLabel>
                    <FieldDescription>
                      Internal categories are for your team and aren't shown to
                      customers.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSetCard>
      </FieldSet>
    </form>
  );
}

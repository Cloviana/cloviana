'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';

import { createCategoryAction } from '../../actions/create-category';
import { categoryKeys } from '../../queries';
import {
  createCategoryRequestSchema,
  type CreateCategoryFormInput,
  type CreateCategoryRequest,
} from '../../schemas/create-category.schema';
import {
  CategoryNameField,
  CategoryParentField,
} from '../form/category-fields';

/** The quick-add form: a name and a parent. It lives inside the dialog's content, so it starts empty each time the dialog opens. */
export function AddCategoryForm({
  slug,
  parentId,
  onClose,
}: {
  slug: string;
  /** Starts with this parent chosen, as when adding a subcategory. */
  parentId?: string;
  onClose: () => void;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const form = useForm<CreateCategoryFormInput, unknown, CreateCategoryRequest>(
    {
      resolver: zodResolver(createCategoryRequestSchema),
      mode: 'onSubmit',
      defaultValues: { name: '', parentId: parentId ?? null },
    },
  );

  const create = useMutation({
    mutationFn: (values: CreateCategoryRequest) =>
      createCategoryAction(slug, values),
    onSuccess: async (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(slug),
      });
      toast.success('Category added.');
      onClose();
    },
    onError: () =>
      toast.error('Could not create the category. Please try again.'),
  });

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={form.handleSubmit((values) => create.mutate(values))}
    >
      <FieldGroup>
        <CategoryNameField control={form.control} id={id} />
        <CategoryParentField control={form.control} id={id} slug={slug} />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Add category
        </Button>
      </DialogFooter>
    </form>
  );
}

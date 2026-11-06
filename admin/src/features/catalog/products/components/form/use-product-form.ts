'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  productFormSchema,
  type ProductFormValues,
  type ProductFormInput,
} from '../../schemas/product.schema';

export type {
  ProductFormValues,
  ProductFormInput,
} from '../../schemas/product.schema';

export function useProductForm(defaultValues?: Partial<ProductFormValues>) {
  const form = useForm<ProductFormValues, unknown, ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    mode: 'onSubmit',
    shouldUnregister: false,
    defaultValues: {
      title: '',
      description: '',
      media: [],
      categoryId: null,
      collectionIds: [],
      options: [],
      offers: [],
      status: 'DRAFT',
      ...defaultValues,
    },
  });
  return { form };
}

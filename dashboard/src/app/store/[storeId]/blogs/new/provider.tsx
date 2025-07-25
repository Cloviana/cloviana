'use client';

import { ReactNode } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import { BlogType } from '@/types/api';

export interface CreateArticleFormValues {
  type: BlogType;
  title: string;
  keywordId: string;
  brandVoice: string;
}

interface Props {
  children: ReactNode;
}

export function BlogInstanceProvider({ children }: Props) {
  const methods = useForm<CreateArticleFormValues>({
    mode: 'onSubmit',
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

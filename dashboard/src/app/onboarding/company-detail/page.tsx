'use client';

import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { useForm } from 'react-hook-form';

import { SplitLayout } from '@/components/layout';
import { paths } from '@/config/paths';
import { useCreateStore } from '@/features/stores/api/create-store';

import {
  StoreSetupSection,
  FormValues,
  StorePreviewSection,
} from './_components';

const OnboardingPage: FC = () => {
  const form = useForm<FormValues>({
    defaultValues: { name: 'My Online Store' },
  });
  const { setError, watch } = form;
  const { mutateAsync: createStore } = useCreateStore();
  const { push } = useRouter();

  const onSubmit = async ({ name, domainUrl }: FormValues) => {
    try {
      const store = await createStore({ name, domainUrl });
      push(paths.onboarding.trial.getHref({ store: store.id }));
    } catch (error: any) {
      setError('domainUrl', { type: 'server', message: error.message });
    }
  };

  const nameValue = watch('name');
  const domainValue = watch('domainUrl');

  return (
    <SplitLayout
      left={<StoreSetupSection form={form} onSubmit={onSubmit} />}
      right={<StorePreviewSection name={nameValue} domainUrl={domainValue} />}
    />
  );
};

export default OnboardingPage;

'use client';

import Image from 'next/image';
import { FC } from 'react';
import { SubmitHandler, UseFormReturn } from 'react-hook-form';

import { StoreForm } from './store-form';

export type FormValues = {
  name: string;
  domainUrl: string;
};

interface StoreSetupSectionProps {
  form: UseFormReturn<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
}

export const StoreSetupSection: FC<StoreSetupSectionProps> = ({
  form,
  onSubmit,
}) => (
  <div className="flex w-full flex-col gap-6">
    <div className="flex items-center gap-8">
      <Image src="/logo-icon.png" width={30} height={30} alt="Cloviana Logo" />
    </div>
    <h1 className="text-3xl font-semibold">Add your business details</h1>
    <p className="text-sm text-neutral-500">
      To get started, please enter the official name of your Shopify store and
      its primary website domain below. These details are key to your branding
      and customer experience, but you can update them at any time through your
      store settings.
    </p>
    <div className="mt-8 flex-1">
      <StoreForm form={form} onSubmit={onSubmit} />
    </div>
  </div>
);

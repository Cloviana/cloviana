'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useParams, usePathname } from 'next/navigation';
import React, { FC } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

import { useGetStore } from '@/api/stores/get-store';
import { TextField } from '@/components/input';
import { Button } from '@/components/legacy';
import { startShopifyInstall } from '@/features/shopify/actions/start-install';

import { IntegrationCard } from './integration-card';

interface FormValues {
  storeUrl: string;
}

export const ShopifyCard: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>();
  const pathname = usePathname();
  const { storeId } = useParams();
  const { data: store } = useGetStore(storeId as string);

  const onSubmit: SubmitHandler<FormValues> = async ({ storeUrl }) => {
    const url = await startShopifyInstall(storeUrl, pathname);
    window.location.href = url;
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger disabled={Boolean(store?.channel)}>
        <IntegrationCard
          title="Shopify"
          description="Connect your Shopify store to optimize your content and boost your SEO."
          iconSrc="/icons/shopify.png"
          badgeLabel="Official"
          active={Boolean(store?.channel)}
        />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-white/30 backdrop-blur-sm" />

        <Dialog.Content className="fixed left-1/2 top-1/2 w-96 max-w-full -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white">
          <div className="border-b px-5 py-3.5">
            <Dialog.Title className="text-sm font-medium">
              Connect Your Shopify Store
            </Dialog.Title>
          </div>

          <div className="border-b px-5 py-3.5">
            <TextField
              label="Shopify store URL"
              size="sm"
              variant="surface"
              placeholder="your-store.myshopify.com"
              error={errors.storeUrl?.message}
              {...register('storeUrl', {
                required: 'Store URL is required',
                pattern: {
                  value: /^[a-z0-9-]+\.myshopify\.com$/,
                  message: 'Enter a valid Shopify store URL',
                },
              })}
            />
          </div>

          <div className="flex justify-end gap-2 border-b px-5 py-3.5">
            <Dialog.Close>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </Dialog.Close>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={!isValid}
            >
              Connect
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

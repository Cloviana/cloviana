'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { Button } from '@/components/ui/button';
import { FlipWords } from '@/components/ui/flip-words';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getShopifyOauthUrl } from '@/features/auth/api/get-shopify-oauth-url';
import { useGetStore } from '@/features/stores/api/get-store';
import { useGetStoreStatus } from '@/features/stores/api/get-store-status';

const shopifySchema = z.object({
  shop: z
    .string()
    .trim()
    .min(1, 'Shopify domain is required')
    .regex(
      /^([a-z0-9][a-z0-9-]+)\.myshopify\.com$/i,
      'Enter a valid domain like yourstore.myshopify.com',
    ),
});

type ShopifyFormValues = z.infer<typeof shopifySchema>;

export const ShopifyConnectionGate = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { storeId } = useParams<{ storeId?: string }>();
  if (!storeId)
    throw new Error('ShopifyConnectionGate must be used under /[storeId]');

  const { data: store, refetch: refetchStore } = useGetStore(storeId);
  const shopifyConnected = Boolean(store?.channel);

  const { data: storeStatus } = useGetStoreStatus(storeId, {
    config: {
      enabled: Boolean(storeId && store?.status === 'INITIALIZING'),
      refetchInterval: 10_000,
    },
  });

  const status = storeStatus?.status ?? store?.status;
  const isInitializing = status === 'INITIALIZING';

  useEffect(() => {
    if (!status || status === 'INITIALIZING') return;
    refetchStore();
  }, [status, refetchStore]);

  const form = useForm<ShopifyFormValues>({
    resolver: zodResolver(shopifySchema),
    defaultValues: {
      shop: store?.channel?.shop ?? '',
    },
  });

  const onSubmit = async ({ shop }: ShopifyFormValues) => {
    const url = await getShopifyOauthUrl({ shop, storeId });
    window.location.href = url;
  };

  if (!store) return null;

  if (isInitializing) {
    return (
      <>
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-2 bg-white/30 backdrop-blur-sm">
          <Spinner className="text-black-600 size-4.5" variant="1" />
          <FlipWords
            words={[
              'Connecting to your store',
              'Syncing your product catalog',
              'Verifying store configuration',
              'Preparing your workspace',
              'Optimizing initial setup',
              'Securing your integration',
              'Final checks before launch',
            ]}
            duration={2500}
            className="text-foreground-light text-sm font-medium"
          />
        </div>
        {children}
      </>
    );
  }

  if (shopifyConnected) return <>{children}</>;

  return (
    <div className="bg-background flex h-full w-full items-center justify-center overflow-y-auto">
      <div className="w-full max-w-lg px-6 py-10">
        <h1 className="text-xl font-semibold">Connect Shopify</h1>
        <p className="text-foreground-light mt-1 text-sm">
          Connect your Shopify store to sync products and publish content. Enter
          your Shopify domain (e.g. yourstore.myshopify.com).
        </p>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="shop"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="yourstore.myshopify.com"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4">
                <Button
                  type="submit"
                  variant="secondary"
                  size="default"
                  disabled={!form.formState.isValid}
                  loading={form.formState.isSubmitting}
                  className="w-full"
                >
                  Connect
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';

import { useGetStore } from '@/api/stores/get-store';
import { Button } from '@/components/actions';
import { GIcon } from '@/components/icons';
import { TextField } from '@/components/input';
import * as Page from '@/components/layout/page';
import { startShopifyInstall } from '@/features/shopify/actions/start-install';

type FormValues = { storeUrl: string };

export default function IntegrationsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const pathname = usePathname();
  const { data: store } = useGetStore(storeId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: 'onChange' });

  const onSubmit: SubmitHandler<FormValues> = async ({ storeUrl }) => {
    const url = await startShopifyInstall(storeUrl, pathname);
    window.location.href = url;
  };

  return (
    <Page.Root>
      <Page.Header>
        <Page.Title>Integrations</Page.Title>
      </Page.Header>

      <Page.Content centeredLayout>
        <div className="flex max-w-md flex-col gap-5 md:max-w-xs">
          <Image
            src="/icons/shopify-logo-full.svg"
            alt="Shopify icon"
            priority
            sizes="120px"
            width={120}
            height={120}
            className="object-contain"
          />

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Integration</h3>
            <p className="text-xs text-foreground-light">
              Connect your Shopify store to seamlessly sync products,
              collections, and blog posts. Our AI SEO engine turns your catalog
              into search-ready content with consistent metadata, clean slugs,
              and internal links — all aligned to your brand voice and markets.
            </p>
          </div>

          <Dialog.Root>
            <Dialog.Trigger asChild disabled={Boolean(store?.channel)}>
              {store?.channel ? (
                <div className="flex items-center gap-2">
                  <GIcon name="check_circle" className="text-green-700" />
                  <span className="text-xs text-green-700">Connected</span>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="add"
                  className="w-fit"
                >
                  Connect Shopify
                </Button>
              )}
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-white/30 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 w-96 max-w-full -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white shadow-sm">
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

                <div className="flex justify-end gap-2 px-5 py-3.5">
                  <Dialog.Close asChild>
                    <Button variant="secondary" size="sm">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                    disabled={!isValid || isSubmitting}
                  >
                    Connect
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </Page.Content>
    </Page.Root>
  );
}

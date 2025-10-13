'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useParams, useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';

import { useGetStore } from '@/api/stores/get-store';
import { Button } from '@/components/deprecated/actions';
import { GIcon } from '@/components/deprecated/icons';
import { TextField } from '@/components/deprecated/input';
import { Page } from '@/components/deprecated/layout';

type FormValues = { shop: string };

export default function IntegrationsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: store } = useGetStore(storeId);
  const connected = Boolean(store?.channel);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: 'onSubmit' });

  const { push } = useRouter();

  const onSubmit: SubmitHandler<FormValues> = async ({ shop }) => {
    const q = new URLSearchParams({ shop }).toString();
    push(`/api/auth/shopify?${q}`);
  };

  return (
    <Page.Root>
      <Page.Header>
        <Page.Title>Integrations</Page.Title>
      </Page.Header>

      <Page.Content>
        <div className="grid h-full min-h-full place-items-center px-6 py-16 md:py-24">
          <div className="flex max-w-md flex-col items-center gap-5 text-center md:max-w-xs md:items-start md:text-left">
            <img
              src="/icons/shopify-logo-full.svg"
              alt="Shopify icon"
              fetchPriority="high"
              width={120}
            />

            <div className="flex flex-col gap-2">
              <h3 className="text-foreground text-sm font-medium">
                Integration
              </h3>
              <p className="text-foreground-light text-xs">
                Connect your Shopify store to seamlessly sync products,
                collections, and blog posts. Our AI SEO engine turns your
                catalog into search-ready content with consistent metadata,
                clean slugs, and internal links — all aligned to your brand
                voice and markets.
              </p>
            </div>

            {connected ? (
              <div className="flex items-center gap-2">
                <GIcon name="check_circle" className="text-green-700" />
                <span className="text-xs text-green-700">Connected</span>
              </div>
            ) : (
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="add"
                    className="w-fit"
                  >
                    Connect Shopify
                  </Button>
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Overlay className="backdrop-blur-xs fixed inset-0 bg-white/30" />
                  <Dialog.Content className="shadow-xs fixed left-1/2 top-1/2 w-96 max-w-full -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white">
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
                        error={errors.shop?.message}
                        {...register('shop', {
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
            )}
          </div>
        </div>
      </Page.Content>
    </Page.Root>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getShopifyOauthUrl } from '@/features/auth/api/get-shopify-oauth-url';
import { useGetStore } from '@/features/stores/api/get-store';

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

export const ShopifyButton = () => {
  const { storeId } = useParams() as { storeId: string };

  const { data: store } = useGetStore(storeId);
  const connected = Boolean(store?.channel);

  const form = useForm<ShopifyFormValues>({
    resolver: zodResolver(shopifySchema),
    mode: 'onSubmit',
    defaultValues: {
      shop: store?.channel?.shop ?? '',
    },
  });

  const onSubmit = async ({ shop }: ShopifyFormValues) => {
    const url = await getShopifyOauthUrl({ shop, storeId });
    window.location.href = url;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <img src="/icons/shopify.svg" alt="shopify" className="size-5" />
          {connected ? 'Shopify Connected' : 'Connect Shopify'}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Connect Shopify</DialogTitle>
          <DialogDescription>
            Connect your Shopify store to sync products and publish content.
            Enter your Shopify domain (e.g. yourstore.myshopify.com).
          </DialogDescription>
        </DialogHeader>

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
                      readOnly={connected}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col gap-x-2.5 gap-y-2 sm:flex-row sm:items-center sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="default">
                  Close
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="secondary"
                size="default"
                disabled={!form.formState.isValid || connected}
                loading={form.formState.isSubmitting}
              >
                Connect
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

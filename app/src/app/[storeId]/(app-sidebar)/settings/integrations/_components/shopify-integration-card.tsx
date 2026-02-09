'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
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

export const ShopifyIntegrationCard = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [open, setOpen] = useState(false);
  const { data: store } = useGetStore(storeId);

  const shopifyConnected = Boolean(store?.channel);
  const connectedShopName = store?.channel?.shop;

  const form = useForm<ShopifyFormValues>({
    resolver: zodResolver(shopifySchema),
    mode: 'onSubmit',
    defaultValues: { shop: '' },
  });

  const onSubmit = async ({ shop }: ShopifyFormValues) => {
    if (!storeId) return;
    const url = await getShopifyOauthUrl({ shop, storeId });
    window.location.href = url;
  };

  if (shopifyConnected) {
    return (
      <Item variant="outline" size="default" className="bg-white">
        <ItemMedia variant="icon">
          <Image
            src="/icons/shopify.svg"
            alt="Shopify"
            width={30}
            height={30}
          />
        </ItemMedia>

        <ItemContent>
          <ItemTitle>Connected as {connectedShopName}</ItemTitle>
        </ItemContent>

        <ItemActions />
      </Item>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Item variant="outline" size="default" className="bg-white">
        <ItemMedia variant="icon">
          <Image
            src="/icons/shopify.svg"
            alt="Shopify"
            width={30}
            height={30}
          />
        </ItemMedia>

        <ItemContent>
          <ItemTitle>Shopify</ItemTitle>
        </ItemContent>

        <ItemActions>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Connect
            </Button>
          </DialogTrigger>
        </ItemActions>
      </Item>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Shopify</DialogTitle>
          <DialogDescription>
            Enter your Shopify domain to sync products.
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant={'secondary'}
                size={'default'}
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                loading={form.formState.isSubmitting}
              >
                Connect
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

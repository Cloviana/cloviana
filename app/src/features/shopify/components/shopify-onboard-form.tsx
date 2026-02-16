'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getShopifyOnboardUrl } from '@/features/auth/api/get-shopify-onboard-url';

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

type ShopifyOnboardFormProps = {
  onCallback?: () => void;
};

export function ShopifyOnboardForm({ onCallback }: ShopifyOnboardFormProps) {
  const form = useForm<ShopifyFormValues>({
    resolver: zodResolver(shopifySchema),
    mode: 'onSubmit',
    defaultValues: { shop: '' },
  });

  const isDisabled = useMemo(
    () => !form.formState.isValid || form.formState.isSubmitting,
    [form.formState.isSubmitting, form.formState.isValid],
  );

  const onSubmit = async ({ shop }: ShopifyFormValues) => {
    const url = await getShopifyOnboardUrl({ shop });
    onCallback?.();
    window.location.href = url;
  };

  return (
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
              <FormDescription>
                Provide your Shopify store domain (e.g.,
                yourstore.myshopify.com) to authorize the connection.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="secondary"
            size="default"
            disabled={isDisabled}
            loading={form.formState.isSubmitting}
          >
            Connect
          </Button>
        </div>
      </form>
    </Form>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { completeOnboardingAction } from '../actions/complete-onboarding';
import {
  marketplaceFormSchema,
  type MarketplaceFormValues,
} from '../schemas/marketplace-form.schema';

export function MarketplaceForm() {
  const form = useForm<MarketplaceFormValues>({
    resolver: zodResolver(marketplaceFormSchema),
    mode: 'onSubmit',
    defaultValues: { marketplaceName: '' },
  });

  // The action redirects to the dashboard on success, so it only returns when something failed.
  async function onSubmit(values: MarketplaceFormValues) {
    const result = await completeOnboardingAction(values);
    toast.error(result.message);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Name your marketplace</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="marketplaceName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="marketplace-name" className="sr-only">
                  Marketplace name
                </FieldLabel>
                <Input
                  {...field}
                  id="marketplace-name"
                  size="lg"
                  placeholder="Acme Marketplace"
                  autoComplete="organization"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Use your brand or business name. You can change it later.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={form.formState.isSubmitting}
          >
            Create marketplace
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

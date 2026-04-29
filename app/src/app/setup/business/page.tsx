'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { paths } from '@/config/paths';
import { startBusinessSetup } from '@/features/businesses/api/business-setup';
import { BusinessSetupActions } from '@/features/businesses/components/setup/business-setup-actions';
import { BusinessSetupFooter } from '@/features/businesses/components/setup/business-setup-footer';
import { BusinessSetupHeading } from '@/features/businesses/components/setup/business-setup-heading';
import { BusinessSetupLayout } from '@/features/businesses/components/setup/business-setup-layout';
import { startBusinessSetupSchema } from '@/features/businesses/schemas/business-setup';

export default function StartBusinessSetupPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof startBusinessSetupSchema>>({
    resolver: zodResolver(startBusinessSetupSchema),
    mode: 'onSubmit',
    defaultValues: {
      domain: '',
    },
  });

  async function onSubmit(values: z.infer<typeof startBusinessSetupSchema>) {
    try {
      const business = await startBusinessSetup({
        domain: values.domain.trim(),
      });
      router.push(paths.setup.business.detail.getHref(business.id));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start business setup right now.';
      toast.error(message);
    }
  }

  return (
    <BusinessSetupLayout>
      <BusinessSetupHeading
        title="Set up your business"
        subtitle="Start with your domain and we'll prefill the rest"
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputGroup size="lg">
                    <InputGroupAddon>
                      <InputGroupText>https://</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      inputMode="url"
                      placeholder="yourcompany.com"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage className="pl-1" />
              </FormItem>
            )}
          />

          <BusinessSetupActions
            canGoBack={false}
            isSubmitting={form.formState.isSubmitting}
            isContinueDisabled={
              form.formState.isSubmitting ||
              !form.formState.isDirty ||
              !form.formState.isValid
            }
          />
        </form>
      </Form>

      <BusinessSetupFooter description="Enter the website your customers know you by. We'll use it to prepare your business profile automatically." />
    </BusinessSetupLayout>
  );
}

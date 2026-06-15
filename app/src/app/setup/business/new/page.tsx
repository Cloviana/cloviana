'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { paths } from '@/config/paths';
import { startBusinessSetup } from '@/features/businesses/api/business-setup';
import { BusinessSetupActions } from '@/features/businesses/components/setup/business-setup-actions';
import { BusinessSetupHeading } from '@/features/businesses/components/setup/business-setup-heading';
import { BusinessSetupLayout } from '@/features/businesses/components/setup/business-setup-layout';
import { startBusinessSetupSchema } from '@/features/businesses/schemas/business-setup';
import { useUser } from '@/hooks/use-user';

const intlWithTimeZones = Intl as typeof Intl & {
  supportedValuesOf?: (key: 'timeZone') => string[];
};

const fallbackTimeZones = [
  'America/Los_Angeles',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const fieldClassName =
  'h-10 rounded-md border-slate-200 bg-white text-slate-900 focus-visible:border-blue-600 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0';

export default function StartBusinessSetupPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isNavigating, setIsNavigating] = useState(false);
  const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZones = useMemo(() => {
    const supported = intlWithTimeZones.supportedValuesOf?.('timeZone');
    return supported?.length ? supported : fallbackTimeZones;
  }, []);
  const form = useForm<z.infer<typeof startBusinessSetupSchema>>({
    resolver: zodResolver(startBusinessSetupSchema),
    mode: 'onChange',
    defaultValues: {
      workEmail: '',
      brandName: '',
      domain: '',
      location: '',
      timezone: detectedTimeZone,
    },
  });
  const values = form.watch();

  useEffect(() => {
    if (user?.email) {
      form.setValue('workEmail', user.email, { shouldValidate: true });
    }
  }, [form, user?.email]);

  async function onSubmit(values: z.infer<typeof startBusinessSetupSchema>) {
    setIsNavigating(true);
    try {
      const business = await startBusinessSetup(values);
      router.push(paths.setup.business.detail.getHref(business.id));
    } catch (error) {
      setIsNavigating(false);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to research this client right now.',
      );
    }
  }

  return (
    <BusinessSetupLayout
      currentStepIndex={1}
      brandName={values.brandName}
      summaryItems={[
        { label: 'Website', value: values.domain || 'Not set' },
        { label: 'Market', value: values.location || 'Not set' },
        { label: 'Time zone', value: values.timezone || 'Not set' },
      ]}
    >
      <BusinessSetupHeading
        eyebrow="Project details, step 1 of 4"
        title="Add the brand you want to monitor"
        subtitle="Give Cloviana the facts it cannot infer. Cloviana will research the brand and prepare its market profile for your review."
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="workEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      readOnly
                      className={fieldClassName}
                      placeholder="you@agency.com"
                    />
                  </FormControl>
                  <FormDescription>
                    Tied to the signed-in workspace owner.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={fieldClassName}
                      placeholder="Acme"
                      autoComplete="organization"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <InputGroup className={fieldClassName}>
                    <InputGroupAddon>
                      <InputGroupText>https://</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      inputMode="url"
                      placeholder="client.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </InputGroup>
                </FormControl>
                <FormDescription>
                  Cloviana will research the official site and public market
                  context.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary market</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={fieldClassName}
                      placeholder="United States"
                      autoComplete="country-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time zone</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={fieldClassName}>
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent align="start">
                      {timeZones.map((timeZone) => (
                        <SelectItem key={timeZone} value={timeZone}>
                          {timeZone.replaceAll('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <BusinessSetupActions
            canGoBack={false}
            continueLabel="Research brand"
            isSubmitting={form.formState.isSubmitting || isNavigating}
            isContinueDisabled={isNavigating}
          />
        </form>
      </Form>
    </BusinessSetupLayout>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { Button } from '@/components/ui/button';
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
import { paths } from '@/config/paths';
import { useCreateStore } from '@/features/stores/api/create-store';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';

const domainRegex = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/;

const formSchema = z.object({
  firstName: z.string().min(1, { message: 'Please enter your first name.' }),
  lastName: z.string().min(1, { message: 'Please enter your last name.' }),
  storeName: z.string().min(1, { message: 'Please enter your store name.' }),
  domainUrl: z
    .string()
    .min(1, { message: 'Please enter your primary domain.' })
    .refine((value) => !/^https?:\/\//i.test(value), {
      message: 'Do not include http:// or https://, only the domain name.',
    })
    .refine((value) => domainRegex.test(value), {
      message: 'Enter a valid domain such as yourbrand.com.',
    })
    .refine((value) => !value.endsWith('.myshopify.com'), {
      message:
        'Use your primary brand domain, not your Shopify myshopify.com URL.',
    }),
});

type FormValues = z.infer<typeof formSchema>;

function normalizeDomain(value: string) {
  return value.replace(/^https?:\/\//i, '');
}

export default function OnboardingPage() {
  const supabase = createClient();
  const { user, isLoading: fetchingUser } = useUser();
  const { mutateAsync: createStore } = useCreateStore();
  const { push } = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      firstName: '',
      lastName: '',
      storeName: '',
      domainUrl: '',
    },
  });

  useEffect(() => {
    if (!user) return;

    form.reset((prev) => ({
      ...prev,
      firstName: user.user_metadata?.firstName || '',
      lastName: user.user_metadata?.lastName || '',
    }));
  }, [user, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    form.clearErrors();

    const { error: profileError } = await supabase.auth.updateUser({
      data: {
        firstName: values.firstName,
        lastName: values.lastName,
      },
    });

    if (profileError) {
      form.setError('root', {
        type: 'server',
        message:
          'Something went wrong updating your profile. Please try again.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const { id } = await createStore({
        name: values.storeName,
        domainUrl: values.domainUrl,
      });

      push(paths.store.getHref(id));
    } catch (error: any) {
      form.setError('domainUrl', {
        type: 'server',
        message: error?.message || 'Unable to create store. Please try again.',
      });
      setIsSubmitting(false);
    }
  }

  if (fetchingUser) {
    return <LoadingFallback />;
  }

  return (
    <div className="mx-auto px-4 pt-24 pb-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-12">
        <div className="space-y-1">
          <h1 className="text-xl font-medium">
            Create your profile and organization
          </h1>
          <p className="text-foreground-light text-sm">
            Let&apos;s get you set up. You&apos;ll enter your details and create
            your first store.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 items-start gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" size="lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" size="lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store name</FormLabel>

                  <FormControl>
                    <Input placeholder="Your store name" size="lg" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    This is the public name of your store that customers
                    recognize.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domainUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>

                  <div className="relative">
                    <span className="text-foreground-lighter pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">
                      https://
                    </span>

                    <FormControl>
                      <Input
                        placeholder="yourbrand.com"
                        size="lg"
                        className="pl-15"
                        {...field}
                        onChange={(e) =>
                          field.onChange(normalizeDomain(e.target.value))
                        }
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                  <FormDescription>
                    Enter your primary brand domain such as cloviana.com. Avoid
                    using your Shopify myshopify.com URL.
                  </FormDescription>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              variant="secondary"
              size="lg"
              loading={isSubmitting}
            >
              Continue
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

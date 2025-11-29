'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Spinner } from '@/components/ui/spinner';
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
    }
  }

  if (fetchingUser) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-20">
        <Spinner className="text-black-600 size-5" />
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 pt-16 pb-8">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-12">
        <div className="space-y-1">
          <h1 className="text-[20px] font-medium">
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
                  <FormDescription className="-mt-1 mb-1">
                    This is the public name of your store that customers
                    recognize.
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Your store name" size="lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domainUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormDescription className="-mt-1 mb-1">
                    Enter your primary brand domain such as cloviana.com. Avoid
                    using your Shopify myshopify.com URL.
                  </FormDescription>

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
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              variant="secondary"
              size="lg"
              loading={form.formState.isSubmitting}
            >
              Continue
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

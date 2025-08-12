'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';

import { Anchor, Button } from '@/components/actions';
import { AppleLogoIcon, GoogleLogoIcon } from '@/components/icons';
import { Form, TextField } from '@/components/input';
import { FormLayout, Seperator } from '@/components/layout';
import { paths } from '@/config/paths';
import { googleSignIn } from '@/features/auth/actions/google-sign-in';
import { AuthRootLayout } from '@/features/auth/components/auth-layout';
import { startShopifyInstall } from '@/features/shopify/actions/start-install';

type FormValues = { shop: string };

export default function Page() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: 'onSubmit' });
  const pathname = usePathname();

  const onSubmit: SubmitHandler<FormValues> = async ({ shop }) => {
    const url = await startShopifyInstall(shop, pathname);
    window.location.href = url;
  };

  return (
    <AuthRootLayout>
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-center gap-8">
          <Image
            src="/logo-icon.png"
            width={30}
            height={30}
            alt="Cloviana Logo"
          />
        </div>
        <h1 className="text-3xl font-semibold">Welcome to Cloviana</h1>
        <p className="text-sm text-neutral-500">
          Already have an account?{' '}
          <Anchor href={paths.auth.login.getHref()}>Log in</Anchor>
        </p>

        <div className="mt-8 flex w-full flex-col gap-6">
          <Form onSubmit={handleSubmit(onSubmit)}>
            <FormLayout>
              <TextField
                label="Shopify store URL"
                variant="surface"
                placeholder="your-store.myshopify.com"
                error={errors.shop?.message}
                {...register('shop', {
                  required: 'Shopify store URL is required',
                  pattern: {
                    value: /^[a-z0-9-]+\.myshopify\.com$/,
                    message: 'Enter a valid Shopify store URL',
                  },
                })}
              />
              <Button
                variant="primary"
                loading={isSubmitting}
                submit
                disabled={!isValid}
              >
                Continue
              </Button>
            </FormLayout>
          </Form>

          <Seperator />

          <div className="flex w-full flex-col gap-4 lg:flex-row">
            <Button
              fullWidth
              icon={GoogleLogoIcon}
              allowIconColor={false}
              onClick={googleSignIn}
            >
              Google
            </Button>
            <Button fullWidth icon={AppleLogoIcon} allowIconColor={false}>
              Apple
            </Button>
          </div>
        </div>
      </div>
    </AuthRootLayout>
  );
}

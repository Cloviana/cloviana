'use client';

import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { AppleLogoIcon, GoogleLogoIcon } from '@/components/icons';
import { Form, TextField } from '@/components/input';
import { FormLayout, Seperator } from '@/components/layout';
import { Button } from '@/components/legacy';
import { cn } from '@/utils/cn';

import { googleSignIn } from '../actions/google-sign-in';

interface AuthFormProps {
  className?: string;
}

type FormValues = { shop: string };

export const AuthForm: FC<AuthFormProps> = ({ className }) => {
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
    <div className={cn('flex w-full flex-col gap-6', className)}>
      <Form
        onSubmit={handleSubmit(onSubmit)}
        className="pointer-events-none opacity-50"
      >
        <FormLayout>
          <TextField
            label="Shopify store URL"
            variant="surface"
            placeholder="your-store.myshopify.com"
            error={errors.shop?.message}
            {...register('shop', {
              required: 'Shopify store URL is required',
              pattern: {
                value: /^[a-z0-9-]+\.myshopify\.com$/i,
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
  );
};

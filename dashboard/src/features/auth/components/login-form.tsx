'use client';

import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';

import { Button } from '@/components/actions';
import { AppleLogoIcon, GoogleLogoIcon } from '@/components/icons';
import { Form, TextField } from '@/components/input';
import { FormLayout, Seperator } from '@/components/layout';
import { paths } from '@/config/paths';

import { googleSignIn } from '../utils/google-sign-in';
import { signIn } from '../utils/sign-in';

type FormValues = {
  email: string;
  password: string;
};

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const { push } = useRouter();

  const onSubmit: SubmitHandler<FormValues> = async ({ email, password }) => {
    const { success, message } = await signIn(email, password);

    if (success) {
      push(paths.store.getHref());
    } else {
      setError('password', { type: 'server', message });
    }
  };

  return (
    <div className="mt-8 flex w-full flex-col gap-6">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormLayout>
          <TextField
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />

          <TextField
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              validate: {
                hasLowerCase: (value) =>
                  /[a-z]/.test(value) ||
                  'Password must contain at least one lowercase letter',
                hasUpperCase: (value) =>
                  /[A-Z]/.test(value) ||
                  'Password must contain at least one uppercase letter',
                hasNumber: (value) =>
                  /[0-9]/.test(value) ||
                  'Password must contain at least one number',
              },
            })}
          />

          <Button submit variant="primary" loading={isSubmitting}>
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

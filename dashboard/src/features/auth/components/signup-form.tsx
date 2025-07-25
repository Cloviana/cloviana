'use client';

import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';

import { Button } from '@/components/actions';
import { AppleLogoIcon, GoogleLogoIcon } from '@/components/icons';
import { Form, TextField } from '@/components/input';
import { FormLayout, Seperator } from '@/components/layout';
import { paths } from '@/config/paths';

import { googleSignIn } from '../utils/google-sign-in';
import { signUp } from '../utils/sign-up';

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export const SignupForm = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const { push } = useRouter();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const { email, password, firstName, lastName } = data;
    const { success, message } = await signUp(email, password, {
      firstName,
      lastName,
    });

    if (success) {
      push(paths.onboarding.companyDetail.getHref());
    } else {
      setError('password', { type: 'server', message });
    }
  };

  return (
    <div className="mt-8 flex w-full flex-col gap-6">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormLayout>
          <FormLayout.Group>
            <TextField
              type="firstName"
              label="First Name"
              placeholder="Jane"
              error={errors.firstName?.message}
              {...register('firstName', {
                required: 'First name is required',
              })}
            />
            <TextField
              type="lastName"
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register('lastName', {
                required: 'Last name is required',
              })}
            />
          </FormLayout.Group>

          <TextField
            type="email"
            label="Email"
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
            type="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            helpText="Password should contain at least one number and a lowercase and uppercase letter."
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

          <Button variant="primary" loading={isSubmitting} submit>
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

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Anchor } from '@/components/ui/anchor';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { paths } from '@/config/paths';
import { googleSignIn } from '@/features/auth/actions/google-sign-in';
import { signUpWithEmail } from '@/features/auth/actions/sign-up-with-email';

const formSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email.' }),
  password: z
    .string()
    .min(12, { message: 'Password must be at least 12 characters.' }),
});

export function SignUpForm() {
  const formId = useId();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const { push } = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    form.clearErrors('root');
    const result = await signUpWithEmail(values.email, values.password);
    if (!result.success) {
      if (result.message.toLowerCase().includes('already registered')) {
        toast.info('Account already exists. Please sign in instead.');
        push(paths.auth.login.getHref());
        return;
      }
      toast.error(result.message);
      return;
    }
    push(paths.home.getHref());
  }

  return (
    <div
      role="main"
      className="bg-surface flex min-h-svh w-full flex-col px-8 py-12"
    >
      <div className="m-auto flex w-full max-w-md shrink-0 flex-col gap-8">
        <div className="flex items-center gap-8">
          <Image
            src="/logo-icon.png"
            width={128}
            height={125}
            alt="Cloviana logo"
            className="h-[25px] w-auto"
          />
        </div>
        <div className="w-full space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-heading-large">Welcome to Cloviana</h1>
            <p className="text-text-subtle text-body">
              Enter your email to create your account.
            </p>
          </div>
          <div className="space-y-5">
            <Button
              type="button"
              className="w-full"
              variant="outline"
              size="lg"
              onClick={googleSignIn}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/google.svg"
                  width={18}
                  height={18}
                  alt="google"
                />
                Continue with Google
              </div>
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-text-subtle text-body-small font-medium">
                OR
              </span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-email`}>Email</FieldLabel>
                    <Input
                      id={`${formId}-email`}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={
                        fieldState.invalid ? `${formId}-email-error` : undefined
                      }
                      type="email"
                      placeholder="example@company.com"
                      size="lg"
                      {...field}
                    />
                    <FieldError
                      id={`${formId}-email-error`}
                      errors={[fieldState.error]}
                    />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-password`}>
                      Password
                    </FieldLabel>

                    <Input
                      id={`${formId}-password`}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={
                        fieldState.invalid
                          ? `${formId}-password-description ${formId}-password-error`
                          : `${formId}-password-description`
                      }
                      type="password"
                      placeholder="New password"
                      size="lg"
                      {...field}
                    />
                    <FieldDescription id={`${formId}-password-description`}>
                      Must be at least 12 characters in length
                    </FieldDescription>
                    <FieldError
                      id={`${formId}-password-error`}
                      errors={[fieldState.error]}
                    />
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={form.formState.isSubmitting}
              >
                Create Account
                <ChevronRight className="size-4" strokeWidth={2.5} />
              </Button>
            </form>

            <p className="text-text-subtle text-body">
              By continuing, you agree to Cloviana's{' '}
              <Anchor href={paths.regulations.termsOfService.getHref()}>
                Terms of Service
              </Anchor>{' '}
              and{' '}
              <Anchor href={paths.regulations.privacyPolicy.getHref()}>
                Privacy Policy
              </Anchor>
              , and to receive periodic emails with updates.
            </p>

            <p className="text-text-subtle text-body">
              Already have an account?{' '}
              <Anchor href={paths.auth.login.getHref()}>Sign in</Anchor>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

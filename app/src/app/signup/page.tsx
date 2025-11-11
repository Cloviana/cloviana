'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
import { paths } from '@/config/paths';
import { signUpWithEmail } from '@/features/auth/actions/sign-up-with-email';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email.' }),
  password: z
    .string()
    .min(12, { message: 'Password must be at least 12 characters.' }),
});

export default function SignUpPage() {
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
      form.setError('root', { type: 'server', message: result.message });
      return;
    }
    push(paths.store.getHref());
  }

  return (
    <div role="main">
      <div className="mx-auto mt-20 flex w-full max-w-lg flex-col gap-12">
        <div className="flex items-center gap-8">
          <img src="/logo-full.png" className="w-[90px]" alt="Cloviana Logo" />
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-[20px] font-medium">Welcome to Cloviana</h1>
            <p className="text-foreground-light text-sm">
              Sign up and activate your growth teammate in under 3 minutes.
            </p>
          </div>

          <div className="space-y-6">
            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={() => (window.location.href = '/auth/google')}
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
              <span className="text-foreground-lighter text-xs">OR</span>
              <Separator className="flex-1" />
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          variant="white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormDescription className="-mt-1 mb-1">
                        Must be at least 12 characters in length
                      </FormDescription>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          variant="white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  loading={form.formState.isSubmitting}
                  disabled={form.formState.isSubmitting}
                >
                  Continue
                </Button>
              </form>
            </Form>

            <p className="text-foreground-lighter text-[13px]">
              By creating an account, you agree to our{' '}
              <Link
                href={paths.regulations.termsOfService.getHref()}
                className="text-foreground-lighter/80 hover:text-primary underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href={paths.regulations.privacyPolicy.getHref()}
                className="text-foreground-lighter/80 hover:text-primary underline"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <p className="text-foreground-lighter text-[13px]">
              Already have an account?{' '}
              <Link
                href={paths.auth.login.getHref()}
                className="text-foreground-lighter/80 hover:text-primary underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { paths } from '@/config/paths';
import { googleSignIn } from '@/features/auth/actions/google-sign-in';
import { signInWithEmail } from '@/features/auth/actions/sign-in-with-email';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email.' }),
  password: z
    .string()
    .min(12, { message: 'Password must be at least 12 characters.' }),
});

export default function LoginPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const { push } = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    form.clearErrors('root');
    const result = await signInWithEmail(values.email, values.password);
    if (!result.success) {
      form.setError('password', { type: 'server', message: result.message });
      return;
    }
    push(paths.store.getHref());
  }

  return (
    <div
      role="main"
      className="bg-studio h-screen w-screen overflow-y-auto px-7 pt-20 pb-12"
    >
      <div className="mx-auto flex w-full max-w-lg flex-col gap-12">
        <div className="flex items-center gap-8">
          <Image
            src="/logo-icon.png"
            width={125}
            height={125}
            alt="Cloviana Logo"
            className="size-[25px]"
          />
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-[20px] font-medium">
              Welcome back to Cloviana
            </h1>
            <p className="text-foreground-light text-sm">
              Log in to use Cloviana.
            </p>
          </div>

          <div className="space-y-6">
            <Button
              type="button"
              className="w-full bg-white"
              variant="outline"
              size={'lg'}
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
                          placeholder="example@company.com"
                          size={'lg'}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive text-[13px] font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="New password"
                          size={'lg'}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive text-[13px] font-medium" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  variant={'primary'}
                  size={'lg'}
                  loading={form.formState.isSubmitting}
                >
                  Continue
                  <ChevronRight className="size-3.5" strokeWidth={2.5} />
                </Button>
              </form>
            </Form>

            <p className="text-foreground-lighter text-[13px]">
              Don't have an account?{' '}
              <Button variant={'link'}>
                <Link href={paths.auth.signup.getHref()}>Create account</Link>
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { paths } from '@/config/paths';
import { AuthBrandPanel } from '@/features/auth/components/auth-brand-panel';

export default function SignUpPage() {
  redirect('/login');
  return (
    <div
      role="main"
      className="bg-studio text-foreground min-h-screen lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.72fr)]"
    >
      <section className="flex min-h-screen items-center px-7 py-12">
        <div className="mx-auto flex w-full max-w-md flex-col gap-12">
          <Image
            src="/logo-icon.png"
            width={125}
            height={125}
            alt="Cloviana Logo"
            className="size-[25px]"
          />

          <div className="w-full space-y-8">
            <div className="space-y-2">
              <p className="text-foreground-lighter text-xs font-semibold tracking-[0.22em] uppercase">
                Invite-only signup
              </p>
              <h1 className="text-[26px] leading-tight font-medium">
                Create a workspace
              </h1>
              <p className="text-foreground-light text-sm leading-6">
                Signup is still visible, but access is blocked while Samuel
                creates client dashboards manually.
              </p>
            </div>

            <div className="space-y-6">
              <Button
                type="button"
                className="w-full bg-white"
                variant="outline"
                size="lg"
                disabled
              >
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/google.svg"
                    width={18}
                    height={18}
                    alt=""
                  />
                  Continue with Google
                </div>
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-foreground-lighter text-xs">OR</span>
                <Separator className="flex-1" />
              </div>

              <form
                className="space-y-5"
                onSubmit={(event) => event.preventDefault()}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="signup-email">
                    Email
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="example@company.com"
                    size="lg"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="signup-password"
                  >
                    Password
                  </label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="New password"
                    size="lg"
                    disabled
                  />
                  <p className="text-foreground-lighter text-xs">
                    Workspace credentials are issued manually after onboarding.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="primary"
                  size="lg"
                  disabled
                >
                  Create Account
                  <ChevronRight className="size-3.5" strokeWidth={2.5} />
                </Button>
              </form>

              <Button asChild className="w-full" size="lg">
                <Link href={paths.demo.getHref()}>
                  Book a demo
                  <ChevronRight className="size-3.5" strokeWidth={2.5} />
                </Link>
              </Button>

              <p className="text-foreground-lighter text-[13px]">
                Already have workspace access?{' '}
                <Button variant="link">
                  <Link href={paths.auth.login.getHref()}>Enter workspace</Link>
                </Button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <AuthBrandPanel />
    </div>
  );
}

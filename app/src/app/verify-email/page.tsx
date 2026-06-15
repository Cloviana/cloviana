'use client';

import { ArrowLeft, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { resendSignUpConfirmation } from '@/features/auth/actions/resend-sign-up-confirmation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim() ?? '';
  const [isResending, setIsResending] = useState(false);

  async function resend() {
    if (!email) {
      toast.error('Return to signup and enter your work email again.');
      return;
    }

    setIsResending(true);
    try {
      await resendSignUpConfirmation(email);
      toast.success('A new confirmation email has been sent.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to resend the confirmation email.',
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-900 sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col">
        <Image
          src="/logo-icon.png"
          width={24}
          height={24}
          alt="Cloviana"
          className="size-6"
        />

        <div className="flex flex-1 items-center justify-center py-16">
          <section className="w-full max-w-md border-t border-slate-900 pt-8">
            <div className="mb-8 flex size-10 items-center justify-center rounded-full border border-slate-200">
              <Mail className="size-4 text-slate-700" />
            </div>
            <p className="text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">
              Confirm your account
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Check your work inbox
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              We sent a confirmation link to{' '}
              <span className="font-medium text-slate-800">
                {email || 'your work email'}
              </span>
              . Open it to verify the address and continue to Cloviana.
            </p>

            <div className="mt-8 border-y border-slate-200 py-4 text-sm text-slate-600">
              You cannot sign in until the email is confirmed. The link may take
              a minute to arrive; check spam or security filters too.
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button type="button" onClick={resend} loading={isResending}>
                Resend email
              </Button>
              <Button asChild variant="ghost">
                <Link href={paths.auth.login.getHref()}>
                  <ArrowLeft className="size-4" />
                  Back to sign in
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

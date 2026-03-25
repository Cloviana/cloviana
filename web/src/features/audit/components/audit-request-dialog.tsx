'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { RefreshCwIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  RequestAuditInput,
  requestAuditInputSchema,
  useRequestAudit,
} from '@/features/audit/api/request-audit';
import { useVerifyAudit } from '@/features/audit/api/verify-audit';

// ─── Constants ────────────────────────────────────────────────────────────────

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'request' | 'verify';

interface AuditRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Cooldown hook ────────────────────────────────────────────────────────────

function useResendCooldown() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(RESEND_COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(0);
  };

  return { seconds, start, reset };
}

// ─── Step 1: Request form ─────────────────────────────────────────────────────

interface RequestStepProps {
  defaultDomain: string;
  isLoading: boolean;
  onSubmit: (data: RequestAuditInput) => void;
}

function RequestStep({ defaultDomain, isLoading, onSubmit }: RequestStepProps) {
  const form = useForm<RequestAuditInput>({
    resolver: zodResolver(requestAuditInputSchema),
    defaultValues: { domain: defaultDomain, email: '', country: 'US' },
  });

  // Expose setError so the parent can set field errors (e.g. 409 conflict).
  // We return the form so the parent can call form.setError if needed.
  RequestStep.formRef = form;

  useEffect(() => {
    form.setValue('domain', defaultDomain);
  }, [defaultDomain, form.setValue]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <DialogHeader>
          <DialogTitle>Request your AI visibility audit</DialogTitle>
          <DialogDescription>
            We&apos;ll check where you appear across ChatGPT, Perplexity, and
            Google AIO — and rank you against your competitors.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4">
          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your site URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://yoursite.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="sm:items-center sm:justify-between">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Region</FormLabel>
                  <CountryDropdown
                    defaultValue="USA"
                    onChange={(c) => field.onChange(c.alpha2)}
                    slim
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" loading={isLoading}>
            Get Free Report
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
// Mutable ref so the parent dialog can call setError on the form.
RequestStep.formRef = null as ReturnType<
  typeof useForm<RequestAuditInput>
> | null;

// ─── Step 2: OTP verify form ──────────────────────────────────────────────────

interface VerifyStepProps {
  email: string;
  cooldownSeconds: number;
  isVerifying: boolean;
  isResending: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
}

function VerifyStep({
  email,
  cooldownSeconds,
  isVerifying,
  isResending,
  onVerify,
  onResend,
}: VerifyStepProps) {
  const form = useForm<{ code: string }>({
    defaultValues: { code: '' },
  });
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    otpRef.current?.focus();
  }, []);

  // Expose setError so the parent can mark invalid codes.
  VerifyStep.formRef = form;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(({ code }) => onVerify(code))}
        noValidate
      >
        <DialogHeader>
          <DialogTitle>Check your inbox</DialogTitle>
          <DialogDescription>
            Enter the {OTP_LENGTH}-digit code we sent to{' '}
            <span className="text-foreground font-medium">{email}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-8 flex flex-col items-center gap-3">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center">
                <FormControl>
                  <InputOTP
                    ref={otpRef}
                    maxLength={OTP_LENGTH}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator className="mx-2" />
                    <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={cooldownSeconds > 0 || isResending}
            onClick={onResend}
          >
            <RefreshCwIcon />
            {cooldownSeconds > 0
              ? `Resend in ${cooldownSeconds}s`
              : 'Resend Code'}
          </Button>

          <Button type="submit" loading={isVerifying}>
            Verify
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
VerifyStep.formRef = null as ReturnType<
  typeof useForm<{ code: string }>
> | null;

// ─── Dialog ───────────────────────────────────────────────────────────────────

export function AuditRequestDialog({
  open,
  onOpenChange,
}: AuditRequestDialogProps) {
  const domain = useSearchParams().get('domain') ?? '';

  const [step, setStep] = useState<Step>('request');
  const [submittedData, setSubmittedData] = useState<RequestAuditInput | null>(
    null,
  );
  const confettiRef = useRef<ConfettiRef>(null);
  const cooldown = useResendCooldown();

  // Reset dialog state whenever it closes.
  useEffect(() => {
    if (!open) {
      setStep('request');
      setSubmittedData(null);
      cooldown.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: requestAudit, isPending: isRequesting } = useRequestAudit({
    mutationConfig: {
      onSuccess: (_, variables) => {
        setSubmittedData(variables);
        setStep('verify');
        cooldown.start();
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 409) {
          RequestStep.formRef?.setError('email', {
            message: 'An audit for this email already exists.',
          });
        }
      },
    },
  });

  const { mutate: verifyAudit, isPending: isVerifying } = useVerifyAudit({
    mutationConfig: {
      onSuccess: async () => {
        onOpenChange(false);
        toast.success('Your audit is running!', {
          description: "We'll email you when your results are ready.",
        });
        const end = Date.now() + 4000;
        const burst = () => {
          if (Date.now() > end) return;
          confettiRef.current?.fire({
            particleCount: 60,
            spread: 160,
            origin: { y: 0.6 },
            gravity: 0.4,
            decay: 0.95,
            startVelocity: 20,
          });
          setTimeout(burst, 300);
        };
        burst();
      },
      onError: () => {
        VerifyStep.formRef?.setError('code', {
          message: 'Invalid or expired code. Try again.',
        });
      },
    },
  });

  const handleVerify = async (code: string) => {
    if (!submittedData) return;
    verifyAudit({ email: submittedData.email, code: parseInt(code, 10) });
  };

  const handleResend = () => {
    if (!submittedData) return;
    requestAudit(submittedData);
    cooldown.start();
  };

  return (
    <>
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[200] h-full w-full"
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          {step === 'request' ? (
            <RequestStep
              defaultDomain={domain}
              isLoading={isRequesting}
              onSubmit={(data) => requestAudit(data)}
            />
          ) : (
            <VerifyStep
              email={submittedData!.email}
              cooldownSeconds={cooldown.seconds}
              isVerifying={isVerifying}
              isResending={isRequesting}
              onVerify={handleVerify}
              onResend={handleResend}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

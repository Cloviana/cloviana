'use client';

import { Check } from 'lucide-react';
import { useParams } from 'next/navigation';
import { ReactNode, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { useCreateCheckoutSession } from '@/features/billing/api/create-checkout-session';
import { useCreatePortalSession } from '@/features/billing/api/create-portal-session';
import { useGetBusiness } from '@/features/businesses/api/get-business';
import { cn } from '@/utils/cn';

export type IPlan = {
  priceId: string;
  name: 'STARTER' | 'GROWTH' | 'PRO';
  popular: boolean;
  price: number;
  description: string;
  features: string[];
};

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export const plans: IPlan[] = [
  {
    name: 'STARTER',
    priceId:
      env.ENVIRONMENT === 'development'
        ? 'price_1STVpcIN5ime0XaQqiMArmxe'
        : 'price_1T1JdCIby4xu0zVbC7GmFPBI',
    popular: true,
    price: 3900,
    description: 'Your Cloviana workspace subscription for $39/month',
    features: [
      'Access to your Cloviana workspace',
      'Subscription management and billing portal',
      'Team support during the pilot',
      'Ongoing product updates as new capabilities launch',
      'Live chat support',
    ],
  },
];

const PlanWrapper = ({
  children,
  className,
  ...props
}: {
  children: ReactNode;
} & React.ComponentProps<'div'>) => {
  return (
    <div className={cn('w-full bg-white p-6 pb-8', className)} {...props}>
      {children}
    </div>
  );
};

const PlanHeader = ({
  name,
  popular,
  price,
  className,
  ...props
}: {
  name: string;
  popular: boolean;
  price: number;
} & React.ComponentProps<'header'>) => {
  return (
    <header className={cn('mb-2 flex flex-col gap-4', className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="text-foreground text-base font-medium">
          {capitalize(name)}
        </div>
        {popular && <Badge variant={'secondary'}>Popular</Badge>}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-base font-medium">
          ${(price / 100).toFixed(2)}
        </span>
        <span className="text-foreground-light text-xs">USD / month</span>
      </div>
    </header>
  );
};

const PlanDescription = ({
  children,
  className,
  ...props
}: {
  children: ReactNode;
} & React.ComponentProps<'div'>) => {
  return (
    <div className={cn('mt-4 mb-2 min-h-12', className)} {...props}>
      <p className="text-foreground text-xs font-normal">{children}</p>
    </div>
  );
};

const PlanAction = ({
  name,
  active,
  priceId,
  onCheckout,
  isLoading,
  trialEligible,
  className,
  ...props
}: {
  name: IPlan['name'];
  active: boolean;
  priceId: string;
  onCheckout?: (priceId: string) => void;
  isLoading?: boolean;
  trialEligible?: boolean;
} & React.ComponentProps<'div'>) => {
  const disabled = active || !priceId || isLoading;

  const buttonLabel = active
    ? 'Your current plan'
    : trialEligible
      ? 'Start your 14-day free trial'
      : `Upgrade to ${capitalize(name)}`;

  return (
    <div className={cn('mt-1 mb-8', className)} {...props}>
      <Button
        className="w-full"
        variant={'secondary'}
        size={'default'}
        disabled={disabled || isLoading}
        onClick={() => {
          if (!disabled) {
            onCheckout?.(priceId);
          }
        }}
        loading={isLoading}
      >
        {buttonLabel}
      </Button>
    </div>
  );
};

const PlanFeatures = ({
  features,
  className,
  ...props
}: {
  features: string[];
} & React.ComponentProps<'ul'>) => {
  return (
    <ul className={cn('flex flex-col gap-3', className)} {...props}>
      {features.map((feature, idx) => (
        <li key={idx} className="flex flex-row gap-2">
          <Check className="text-foreground-light size-3" />
          <div className="text-foreground-light text-xs">{feature}</div>
        </li>
      ))}
    </ul>
  );
};

export const Plans = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: business } = useGetBusiness(businessId);
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  const { mutateAsync: startCheckout, isPending: isCreatingCheckout } =
    useCreateCheckoutSession();
  const { mutateAsync: createPortalSession, isPending: isCreatingPortal } =
    useCreatePortalSession();

  if (!business) return null;

  const subscription = business.subscription;
  const now = new Date();

  const handleCheckout = async (priceId: string) => {
    if (!businessId || !priceId) return;
    setCheckoutPriceId(priceId);
    try {
      const { url } = await startCheckout({
        data: { businessId, priceId },
      });
      window.location.href = url;
    } finally {
      setCheckoutPriceId(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!businessId) return;
    const { url } = await createPortalSession({ data: { businessId } });
    window.location.href = url;
  };

  const hasActiveSubscription = subscription?.status === 'ACTIVE';
  const trialEligible = !subscription;

  return (
    <div className="relative max-w-5xl">
      <div className="flex flex-wrap gap-5">
        {plans.map((plan) => {
          const samePlan = subscription?.plan.stripePriceId === plan.priceId;
          const inTrial =
            subscription?.trialEndsAt &&
            new Date(subscription.trialEndsAt) > now;
          const active =
            samePlan && (subscription?.status === 'ACTIVE' || !!inTrial);
          const isLoading =
            isCreatingCheckout && checkoutPriceId === plan.priceId;

          return (
            <PlanWrapper
              key={plan.name}
              className="max-w-[320px] min-w-[280px] flex-1 rounded-md border shadow-xs"
            >
              <div className="flex grow flex-col">
                <PlanHeader
                  name={plan.name}
                  popular={plan.popular}
                  price={plan.price}
                />
                <PlanDescription>{plan.description}</PlanDescription>
                <PlanAction
                  name={plan.name}
                  priceId={plan.priceId}
                  active={active}
                  onCheckout={handleCheckout}
                  isLoading={isLoading}
                  trialEligible={trialEligible}
                />
                <PlanFeatures features={plan.features} />
              </div>
            </PlanWrapper>
          );
        })}
      </div>

      <div className="text-foreground-light mt-5 max-w-sm text-center text-[13px]">
        {hasActiveSubscription && (
          <>
            To manage your subscription, open the{' '}
            <Button
              variant="link"
              onClick={handleManageSubscription}
              disabled={isCreatingPortal}
            >
              billing portal
            </Button>{' '}
            and review your billing settings.
          </>
        )}
      </div>
    </div>
  );
};

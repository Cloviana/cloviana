'use client';

import { Check } from 'lucide-react';
import { useParams } from 'next/navigation';
import { ReactNode, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { useCreateCheckoutSession } from '@/features/billing/api/create-checkout-session';
import { useCreatePortalSession } from '@/features/billing/api/create-portal-session';
import { useGetStore } from '@/features/stores/api/get-store';
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
      env.ENVIRONMENT === 'development' ? 'price_1STVpcIN5ime0XaQqiMArmxe' : '',
    popular: true,
    price: 1900,
    description: '10 AI-generated product-focused blog posts per month.',
    features: [
      '10 AI-generated product-focused blog posts per month',
      'Product sync from Shopify',
      'Automatic product linking in blogs',
      'One-click publish to Shopify blog',
      'AI finds customer search terms (basic)',
      'Basic traffic analytics',
      'Shopify dashboard analytics integration (basic)',
      'Editorial approval workflow',
    ],
  },
  {
    name: 'GROWTH',
    priceId: '',
    popular: false,
    price: 7900,
    description:
      'Unlimited blogs with enhanced AI, analytics, and workflow tools.',
    features: [
      'Everything in Starter',
      'Unlimited AI-generated product-focused blog posts',
      'Internal linking optimization',
      'Content calendar & seasonal topics',
      'Shopify dashboard analytics integration (enhanced)',
      'AI engine visibility tracking (Google, ChatGPT, Perplexity)',
      'Brand voice learning (after 5 posts)',
      'Competitor tracking (track 3 competitors)',
    ],
  },
  {
    name: 'PRO',
    priceId: '',
    popular: false,
    price: 14900,
    description:
      'Unlimited blogs with advanced AI, multilingual content, SEO, analytics, AEO/GEO tracking, and revenue reporting.',
    features: [
      'Everything in Growth',
      'Multi-language blog creation (up to 3 languages)',
      'Shopify dashboard analytics integration (advanced, with revenue tracking)',
      'AI engine visibility tracking (real-time, includes ChatGPT Shopping)',
      'Brand voice learning (after 3 posts)',
      'Schema markup for rich SEO snippets',
      'Competitor tracking (track 10 competitors)',
      'Revenue attribution dashboard (advanced)',
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
  className,
  ...props
}: {
  name: IPlan['name'];
  active: boolean;
  priceId: string;
  onCheckout?: (priceId: string) => void;
  isLoading?: boolean;
} & React.ComponentProps<'div'>) => {
  const disabled = active || !priceId || isLoading;

  return (
    <div className={cn('mt-1 mb-8', className)} {...props}>
      <Button
        className="w-full"
        variant={'primary'}
        size={'default'}
        disabled={disabled || isLoading}
        onClick={() => {
          if (!disabled) {
            onCheckout?.(priceId);
          }
        }}
      >
        {active ? 'Your current plan' : `Upgrade to ${capitalize(name)}`}
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
          <Check className="text-primary size-3" />
          <div className="text-foreground-light text-xs">{feature}</div>
        </li>
      ))}
    </ul>
  );
};

export const Plans = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: store } = useGetStore(storeId);
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  const { mutateAsync: startCheckout, isPending: isCreatingCheckout } =
    useCreateCheckoutSession();
  const { mutateAsync: createPortalSession, isPending: isCreatingPortal } =
    useCreatePortalSession();

  if (!store) return null;

  const subscription = store.subscription;
  const now = new Date();

  const handleCheckout = async (priceId: string) => {
    if (!storeId || !priceId) return;
    setCheckoutPriceId(priceId);
    try {
      const { url } = await startCheckout({ data: { storeId, priceId } });
      window.location.href = url;
    } finally {
      setCheckoutPriceId(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!storeId) return;
    const { url } = await createPortalSession({ data: { storeId } });
    window.location.href = url;
  };

  const hasActiveSubscription = subscription?.status === 'ACTIVE';

  return (
    <div className="relative">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
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
              className="rounded-md border shadow-xs"
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

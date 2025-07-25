'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FC, useState } from 'react';

import { Button } from '@/components/actions';
import { BadgeCheckOutlineIcon } from '@/components/icons';
import { paths } from '@/config/paths';
import { createTrialCheckoutSession } from '@/features/billing/api/create-trial-checkout-session';
import { useGetStores } from '@/features/stores/api/get-stores';

const benefits = [
  'Our AI agent finds top keywords fast.',
  'Automatically optimizes each page.',
  'Live dashboard tracks your progress.',
] as const;

export const OfferSection: FC = () => {
  const storeId = useSearchParams().get('store')!;
  const { replace } = useRouter();
  const { data: stores, isLoading } = useGetStores();
  const [loading, setLoading] = useState(false);

  if (isLoading) return null;

  const current = stores?.find((s) => s.id === storeId);
  if (!storeId || current?.status !== 'DRAFT') {
    replace(paths.onboarding.companyDetail.getHref());
    return null;
  }

  const handleContinue = async () => {
    setLoading(true);
    try {
      const { url } = await createTrialCheckoutSession({
        storeId,
        priceId: 'price_1RdqFPIby4xu0zVbWWzSp1Nv',
      });
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-8">
        <Image
          src="/logo-icon.png"
          width={30}
          height={30}
          alt="Cloviana Logo"
        />
      </div>
      <h1 className="text-3xl font-semibold">
        Turn your Shopify store into an SEO powerhouse
      </h1>
      <p className="text-sm text-neutral-500">
        Your store is connected and ready to go. Start your free trial now or
        book a live demo to see your personalized strategy in action.
      </p>
      <div className="mt-2 flex flex-col gap-y-4">
        {benefits.map((text) => (
          <div key={text} className="flex items-center gap-x-3">
            <BadgeCheckOutlineIcon className="size-5 fill-primary" />
            <span className="text-lg font-medium">{text}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-1 items-end">
        <div className="flex w-full flex-col justify-end gap-3 lg:flex-row">
          <Button
            variant="secondary"
            onClick={handleContinue}
            loading={loading}
            disabled={loading}
          >
            Continue without demo
          </Button>
          <Button
            variant="primary"
            external
            url="https://calendly.com/sedorodion2003/30min"
          >
            Book demo
          </Button>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useParams } from 'next/navigation';

import { BusinessSetupWizard } from '@/features/businesses/components/setup/business-setup-wizard';

export default function BusinessSetupDetailPage() {
  const { businessId } = useParams<{ businessId: string }>();

  return <BusinessSetupWizard businessId={businessId} />;
}

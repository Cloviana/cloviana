'use client';

import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { BusinessSetupCompetitorsView } from '@/features/businesses/components/setup/business-setup-competitors-view';
import {
  BusinessSetupProvider,
  useBusinessSetup,
} from '@/features/businesses/components/setup/business-setup-context';
import { BusinessSetupLayout } from '@/features/businesses/components/setup/business-setup-layout';

type BusinessSetupWizardProps = {
  businessId: string;
};

function BusinessSetupWizardContent() {
  const { isInitialLoading, setup } = useBusinessSetup();

  return (
    <BusinessSetupLayout>
      {isInitialLoading ? <LoadingFallback /> : null}
      {!isInitialLoading && !setup ? <ErrorFallback /> : null}
      {!isInitialLoading && setup ? <BusinessSetupCompetitorsView /> : null}
    </BusinessSetupLayout>
  );
}

export function BusinessSetupWizard({ businessId }: BusinessSetupWizardProps) {
  return (
    <BusinessSetupProvider businessId={businessId}>
      <BusinessSetupWizardContent />
    </BusinessSetupProvider>
  );
}

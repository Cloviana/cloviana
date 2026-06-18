'use client';

import { ErrorFallback } from '@/components/fallbacks/error-fallback';
import { LoadingFallback } from '@/components/fallbacks/loading-fallback';

import {
  BusinessSetupProvider,
  useBusinessSetup,
} from './business-setup-context';
import { BusinessSetupLayout } from './business-setup-layout';
import { BusinessSetupProfileView } from './business-setup-profile-view';
import { BusinessSetupPromptsView } from './business-setup-prompts-view';
import { BusinessSetupTopicsView } from './business-setup-topics-view';

function BusinessSetupWizardContent() {
  const { currentStep, currentStepIndex, isInitialLoading, setup, totalSteps } =
    useBusinessSetup();

  return (
    <BusinessSetupLayout
      currentStepIndex={currentStepIndex}
      brandName={setup?.business.name}
    >
      {isInitialLoading ? <LoadingFallback /> : null}
      {!isInitialLoading && !setup ? <ErrorFallback /> : null}
      {!isInitialLoading && setup && currentStep === 'profile' ? (
        <BusinessSetupProfileView />
      ) : null}
      {!isInitialLoading && setup && currentStep === 'topics' ? (
        <BusinessSetupTopicsView />
      ) : null}
      {!isInitialLoading && setup && currentStep === 'prompts' ? (
        <BusinessSetupPromptsView />
      ) : null}
      <span className="sr-only">{totalSteps} setup steps</span>
    </BusinessSetupLayout>
  );
}

export function BusinessSetupWizard({ businessId }: { businessId: string }) {
  return (
    <BusinessSetupProvider businessId={businessId}>
      <BusinessSetupWizardContent />
    </BusinessSetupProvider>
  );
}

'use client';

import type { BusinessSetupStep } from '@/types/api';

export type BusinessSetupView = 'profile' | 'topics' | 'prompts';

export type BusinessSetupStepConfig = {
  queryValue: BusinessSetupView;
  title: string;
  subtitle: string;
};

export const businessSetupStepConfig: Record<
  BusinessSetupView,
  BusinessSetupStepConfig
> = {
  profile: {
    queryValue: 'profile',
    title: 'Shape the market profile',
    subtitle:
      'Review what we found and add the context that changes how buyers discover this client.',
  },
  topics: {
    queryValue: 'topics',
    title: 'Choose the topic universe',
    subtitle:
      'Select the buying conversations Cloviana should monitor across AI search.',
  },
  prompts: {
    queryValue: 'prompts',
    title: 'Approve buyer prompts',
    subtitle:
      'Edit the exact questions we will run across ChatGPT, Claude, Perplexity, and Google AI Overviews.',
  },
};

export function getVisibleBusinessSetupSteps(): BusinessSetupView[] {
  return ['profile', 'topics', 'prompts'];
}

export function getBusinessSetupViewFromBackendStep(
  setupStep: BusinessSetupStep,
): BusinessSetupView {
  switch (setupStep) {
    case 'TOPICS':
      return 'topics';
    case 'PROMPTS':
    case 'COMPLETED':
      return 'prompts';
    case 'DOMAIN':
    case 'PROFILE':
    case 'LOCATION':
    case 'COMPETITORS':
    case 'ATTRIBUTION':
    default:
      return 'profile';
  }
}

export function getNormalizedBusinessSetupView(
  requestedView: string | null,
  backendView: BusinessSetupView,
  visibleViews: BusinessSetupView[],
): BusinessSetupView {
  if (
    !requestedView ||
    !visibleViews.includes(requestedView as BusinessSetupView)
  ) {
    return backendView;
  }

  const requestedIndex = visibleViews.indexOf(
    requestedView as BusinessSetupView,
  );
  const backendIndex = visibleViews.indexOf(backendView);
  return requestedIndex > backendIndex
    ? backendView
    : (requestedView as BusinessSetupView);
}

export function getBusinessSetupStepIndex(
  currentStep: BusinessSetupView,
  visibleViews: BusinessSetupView[],
) {
  return visibleViews.indexOf(currentStep);
}

export function getPreviousBusinessSetupView(
  currentStep: BusinessSetupView,
  visibleViews: BusinessSetupView[],
) {
  return (
    visibleViews[getBusinessSetupStepIndex(currentStep, visibleViews) - 1] ??
    null
  );
}

export function getNextBusinessSetupView(
  currentStep: BusinessSetupView,
  visibleViews: BusinessSetupView[],
) {
  return (
    visibleViews[getBusinessSetupStepIndex(currentStep, visibleViews) + 1] ??
    null
  );
}

export function getBusinessSetupStepHref(
  pathname: string,
  searchParams: URLSearchParams,
  step: BusinessSetupView,
) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('step', step);
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

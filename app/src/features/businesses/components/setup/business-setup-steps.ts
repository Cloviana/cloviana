'use client';

import type { BusinessSetupStep } from '@/types/api';

export type BusinessSetupView = 'competitors';

export type BusinessSetupStepConfig = {
  queryValue: BusinessSetupView;
  title: string;
  subtitle: string;
};

export const businessSetupStepConfig: Record<
  BusinessSetupView,
  BusinessSetupStepConfig
> = {
  competitors: {
    queryValue: 'competitors',
    title: 'Add your competitors',
    subtitle:
      'List the businesses you compete with so we can benchmark you accurately.',
  },
};

export function getVisibleBusinessSetupSteps(): BusinessSetupView[] {
  return ['competitors'];
}

export function getBusinessSetupViewFromBackendStep(
  setupStep: BusinessSetupStep,
): BusinessSetupView {
  switch (setupStep) {
    case 'COMPETITORS':
      return 'competitors';
    case 'COMPLETED':
      return 'competitors';
    default:
      return 'competitors';
  }
}

export function getNormalizedBusinessSetupView(
  requestedView: string | null,
  backendView: BusinessSetupView,
  visibleViews: BusinessSetupView[],
): BusinessSetupView {
  if (!requestedView) {
    return backendView;
  }

  if (!visibleViews.includes(requestedView as BusinessSetupView)) {
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

export function getBusinessSetupProgressValue(
  currentStep: BusinessSetupView,
  visibleViews: BusinessSetupView[],
) {
  if (visibleViews.length === 0) {
    return 0;
  }

  return (
    ((getBusinessSetupStepIndex(currentStep, visibleViews) + 1) /
      visibleViews.length) *
    100
  );
}

export function getPreviousBusinessSetupView(
  currentStep: BusinessSetupView,
  visibleViews: BusinessSetupView[],
) {
  const currentIndex = getBusinessSetupStepIndex(currentStep, visibleViews);
  return visibleViews[currentIndex - 1] ?? null;
}

export function getNextBusinessSetupView(
  currentStep: BusinessSetupView,
  visibleViews: BusinessSetupView[],
) {
  const currentIndex = getBusinessSetupStepIndex(currentStep, visibleViews);
  return visibleViews[currentIndex + 1] ?? null;
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

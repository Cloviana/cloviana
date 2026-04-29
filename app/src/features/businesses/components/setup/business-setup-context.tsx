'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { paths } from '@/config/paths';
import {
  completeBusinessSetup,
  updateBusinessSetupCompetitors,
  useGetBusinessSetup,
} from '@/features/businesses/api/business-setup';
import {
  getBusinessSetupStepHref,
  getBusinessSetupStepIndex,
  getBusinessSetupViewFromBackendStep,
  getNextBusinessSetupView,
  getNormalizedBusinessSetupView,
  getPreviousBusinessSetupView,
  getVisibleBusinessSetupSteps,
  type BusinessSetupView,
} from '@/features/businesses/components/setup/business-setup-steps';
import type { SetupBusinessCompetitorsData } from '@/features/businesses/schemas/business-setup';
import type { BusinessSetup } from '@/features/businesses/types';
import { businessKeys } from '@/lib/react-query';

type SetupStepPayload = SetupBusinessCompetitorsData;

type BusinessSetupContextValue = {
  businessId: string;
  currentStep: BusinessSetupView;
  currentStepIndex: number;
  isInitialLoading: boolean;
  isSaving: boolean;
  setup: BusinessSetup | null;
  totalSteps: number;
  back: () => void;
  next: () => void;
  refresh: () => Promise<BusinessSetup | null>;
  save: (payload: SetupStepPayload) => Promise<void>;
};

const BusinessSetupContext = createContext<
  BusinessSetupContextValue | undefined
>(undefined);

type BusinessSetupProviderProps = {
  businessId: string;
  children: ReactNode;
};

async function saveCurrentStep({
  businessId,
  currentStep,
  payload,
}: {
  businessId: string;
  currentStep: BusinessSetupView;
  payload: SetupStepPayload;
}) {
  switch (currentStep) {
    case 'competitors':
      await updateBusinessSetupCompetitors(
        businessId,
        payload as SetupBusinessCompetitorsData,
      );
      await completeBusinessSetup(businessId);
      return;
  }
}

export function BusinessSetupProvider({
  businessId,
  children,
}: BusinessSetupProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const { data, isPending, isError, refetch } = useGetBusinessSetup(businessId);

  const visibleSteps = useMemo(() => getVisibleBusinessSetupSteps(), []);

  const backendStep = useMemo(
    () =>
      data
        ? getBusinessSetupViewFromBackendStep(data.business.setupStep)
        : visibleSteps[0],
    [data, visibleSteps],
  );

  const currentStep = useMemo(
    () =>
      getNormalizedBusinessSetupView(
        searchParams.get('step'),
        backendStep,
        visibleSteps,
      ),
    [backendStep, searchParams, visibleSteps],
  );

  const currentStepIndex = useMemo(
    () => getBusinessSetupStepIndex(currentStep, visibleSteps) + 1,
    [currentStep, visibleSteps],
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.business.setupStatus === 'COMPLETED') {
      router.replace(paths.business.getHref(businessId));
      return;
    }

    const requestedStep = searchParams.get('step');
    if (requestedStep === currentStep) {
      return;
    }

    router.replace(
      getBusinessSetupStepHref(
        pathname,
        new URLSearchParams(searchParams.toString()),
        currentStep,
      ),
    );
  }, [businessId, currentStep, data, pathname, router, searchParams]);

  const refresh = useCallback(async () => {
    const result = await refetch();
    return result.data ?? null;
  }, [refetch]);

  const next = useCallback(() => {
    const nextStep = getNextBusinessSetupView(currentStep, visibleSteps);

    if (!nextStep) {
      return;
    }

    router.push(
      getBusinessSetupStepHref(
        pathname,
        new URLSearchParams(searchParams.toString()),
        nextStep,
      ),
    );
  }, [currentStep, pathname, router, searchParams, visibleSteps]);

  const back = useCallback(() => {
    const previousStep = getPreviousBusinessSetupView(
      currentStep,
      visibleSteps,
    );

    if (!previousStep) {
      router.push(paths.setup.business.getHref());
      return;
    }

    router.push(
      getBusinessSetupStepHref(
        pathname,
        new URLSearchParams(searchParams.toString()),
        previousStep,
      ),
    );
  }, [currentStep, pathname, router, searchParams, visibleSteps]);

  const save = useCallback(
    async (payload: SetupStepPayload) => {
      if (!data) {
        return;
      }

      setIsSaving(true);

      try {
        await saveCurrentStep({
          businessId,
          currentStep,
          payload,
        });

        await queryClient.invalidateQueries({
          queryKey: businessKeys.setup(businessId),
        });

        const refreshed = await refresh();

        if (refreshed?.business.setupStatus === 'COMPLETED') {
          router.replace(paths.business.getHref(businessId));
          return;
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to save this step right now.';
        toast.error(message);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [businessId, currentStep, data, queryClient, refresh, router],
  );

  const value = useMemo<BusinessSetupContextValue>(
    () => ({
      businessId,
      currentStep,
      currentStepIndex,
      isInitialLoading: isPending,
      isSaving,
      setup: isError ? null : (data ?? null),
      totalSteps: visibleSteps.length,
      back,
      next,
      refresh,
      save,
    }),
    [
      back,
      businessId,
      currentStep,
      next,
      currentStepIndex,
      data,
      isError,
      isPending,
      isSaving,
      refresh,
      save,
      visibleSteps.length,
    ],
  );

  return (
    <BusinessSetupContext.Provider value={value}>
      {children}
    </BusinessSetupContext.Provider>
  );
}

export function useBusinessSetup() {
  const context = useContext(BusinessSetupContext);

  if (!context) {
    throw new Error(
      'useBusinessSetup must be used within BusinessSetupProvider',
    );
  }

  return context;
}

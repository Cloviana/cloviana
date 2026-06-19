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
  updateBusinessSetupProfile,
  updateBusinessSetupTopics,
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
import type {
  SetupBusinessProfileData,
  SetupBusinessPromptsData,
  SetupBusinessTopicsData,
} from '@/features/businesses/schemas/business-setup';
import type { BusinessSetup } from '@/features/businesses/types';
import { businessKeys } from '@/lib/react-query';

type SetupStepPayload =
  | SetupBusinessProfileData
  | SetupBusinessTopicsData
  | SetupBusinessPromptsData;

type BusinessSetupContextValue = {
  businessId: string;
  currentStep: BusinessSetupView;
  currentStepIndex: number;
  isInitialLoading: boolean;
  isSaving: boolean;
  setup: BusinessSetup | null;
  totalSteps: number;
  back: () => void;
  refresh: () => Promise<BusinessSetup | null>;
  save: (payload: SetupStepPayload) => Promise<void>;
};

const BusinessSetupContext = createContext<
  BusinessSetupContextValue | undefined
>(undefined);

export function BusinessSetupProvider({
  businessId,
  children,
}: {
  businessId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const { data, isPending, isError, refetch } = useGetBusinessSetup(businessId);
  const visibleSteps = useMemo(() => getVisibleBusinessSetupSteps(), []);
  const backendStep = data
    ? getBusinessSetupViewFromBackendStep(data.business.setupStep)
    : visibleSteps[0];
  const currentStep = getNormalizedBusinessSetupView(
    searchParams.get('step'),
    backendStep,
    visibleSteps,
  );

  useEffect(() => {
    if (!data) return;
    if (data.business.setupStatus === 'COMPLETED') {
      router.replace(paths.business.getHref(businessId));
      return;
    }

    if (searchParams.get('step') === currentStep) return;
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

  const navigateTo = useCallback(
    (step: BusinessSetupView) => {
      router.push(
        getBusinessSetupStepHref(
          pathname,
          new URLSearchParams(searchParams.toString()),
          step,
        ),
      );
    },
    [pathname, router, searchParams],
  );

  const back = useCallback(() => {
    const previous = getPreviousBusinessSetupView(currentStep, visibleSteps);
    if (!previous) {
      router.push(paths.setup.business.getHref());
      return;
    }
    navigateTo(previous);
  }, [currentStep, navigateTo, router, visibleSteps]);

  const save = useCallback(
    async (payload: SetupStepPayload) => {
      if (!data) return;
      setIsSaving(true);

      try {
        if (currentStep === 'profile') {
          await updateBusinessSetupProfile(
            businessId,
            payload as SetupBusinessProfileData,
          );
        } else if (currentStep === 'topics') {
          await updateBusinessSetupTopics(
            businessId,
            payload as SetupBusinessTopicsData,
          );
        } else {
          await completeBusinessSetup(
            businessId,
            payload as SetupBusinessPromptsData,
          );
          router.replace(paths.business.getHref(businessId));
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: businessKeys.setup(businessId),
        });
        await refresh();
        const next = getNextBusinessSetupView(currentStep, visibleSteps);
        if (next) navigateTo(next);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Unable to save this step.',
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [
      businessId,
      currentStep,
      data,
      navigateTo,
      queryClient,
      refresh,
      router,
      visibleSteps,
    ],
  );

  const value = useMemo<BusinessSetupContextValue>(
    () => ({
      businessId,
      currentStep,
      currentStepIndex:
        getBusinessSetupStepIndex(currentStep, visibleSteps) + 2,
      isInitialLoading: isPending,
      isSaving,
      setup: isError ? null : (data ?? null),
      totalSteps: 4,
      back,
      refresh,
      save,
    }),
    [
      back,
      businessId,
      currentStep,
      data,
      isError,
      isPending,
      isSaving,
      refresh,
      save,
      visibleSteps,
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

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { brandKitKeys, MutationConfig } from '@/lib/react-query';

import type { BrandKit } from '../types';

export type DraftMutationResult<T> = {
  item: T;
  draftRevision: number;
};

type DraftMutation<TVariables, TItem> = (
  input: TVariables,
) => Promise<DraftMutationResult<TItem>>;

export function useBrandKitDraftMutation<
  TVariables extends { businessId: string },
  TItem,
>(
  mutationFn: DraftMutation<TVariables, TItem>,
  mutationConfig?: MutationConfig<DraftMutation<TVariables, TItem>>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    ...mutationConfig,
    mutationKey: brandKitKeys.draftMutations(),
    onSuccess: (...args) => {
      const result = args[0];
      const { businessId } = args[1];
      const queryKey = brandKitKeys.detail(businessId);

      queryClient.setQueryData<BrandKit>(queryKey, (brandKit) =>
        brandKit
          ? { ...brandKit, draftRevision: result.draftRevision }
          : brandKit,
      );
      void queryClient.invalidateQueries({ queryKey, exact: true });
      mutationConfig?.onSuccess?.(...args);
    },
  });
}

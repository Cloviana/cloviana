'use client';

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useGetBrandKit } from '../api/get-brand-kit';
import type { BrandKit } from '../types';

export type BrandKitDraft = Omit<BrandKit, 'id' | 'draftRevision'>;

// A business without a brand kit yet gets this shape from the API too
// (BrandKitService.toAggregate(null)), so it doubles as the pre-hydration
// fallback and the real "nothing saved yet" state.
const EMPTY_BRAND_KIT: BrandKit = {
  id: null,
  brand: { name: '', domain: '' },
  about: null,
  voice: null,
  writerPersona: null,
  draftRevision: 0,
  products: [],
  contentTypes: [],
  audiences: [],
  regions: [],
  rules: [],
  samples: [],
};

function toDraft({
  brand,
  about,
  voice,
  writerPersona,
  products,
  contentTypes,
  audiences,
  regions,
  rules,
  samples,
}: BrandKit): BrandKitDraft {
  return {
    brand,
    about,
    voice,
    writerPersona,
    products,
    contentTypes,
    audiences,
    regions,
    rules,
    samples,
  };
}

type BrandKitDraftContextValue = {
  businessId: string;
  draft: BrandKitDraft;
  setDraft: Dispatch<SetStateAction<BrandKitDraft>>;
};

const BrandKitDraftContext = createContext<BrandKitDraftContextValue | null>(
  null,
);

type BrandKitDraftProviderProps = {
  businessId: string;
  children: ReactNode;
};

export function BrandKitDraftProvider({
  businessId,
  children,
}: BrandKitDraftProviderProps) {
  const { data } = useGetBrandKit(businessId);
  const [draftState, setDraftState] = useState<BrandKitDraft>(() =>
    toDraft(data ?? EMPTY_BRAND_KIT),
  );
  const hydratedBusinessId = useRef(data ? businessId : null);

  useEffect(() => {
    if (!data || hydratedBusinessId.current === businessId) return;

    setDraftState(toDraft(data));
    hydratedBusinessId.current = businessId;
  }, [businessId, data]);
  const value = useMemo<BrandKitDraftContextValue>(
    () => ({
      businessId,
      draft: draftState,
      setDraft: setDraftState,
    }),
    [businessId, draftState],
  );

  return (
    <BrandKitDraftContext.Provider value={value}>
      {children}
    </BrandKitDraftContext.Provider>
  );
}

export function useBrandKitDraft() {
  const context = useContext(BrandKitDraftContext);

  if (!context) {
    throw new Error(
      'useBrandKitDraft must be used within BrandKitDraftProvider',
    );
  }

  return context;
}

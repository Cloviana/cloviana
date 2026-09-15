'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

type BrandHoverContextValue = {
  hoveredBrandId: string | null;
  setHoveredBrandId: (brandId: string | null) => void;
};

const BrandHoverContext = createContext<BrandHoverContextValue | null>(null);

export function BrandHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null);
  const value = useMemo(
    () => ({ hoveredBrandId, setHoveredBrandId }),
    [hoveredBrandId],
  );

  return (
    <BrandHoverContext.Provider value={value}>
      {children}
    </BrandHoverContext.Provider>
  );
}

export function useBrandHover() {
  const context = useContext(BrandHoverContext);

  if (!context) {
    throw new Error('useBrandHover must be used within BrandHoverProvider');
  }

  return context;
}

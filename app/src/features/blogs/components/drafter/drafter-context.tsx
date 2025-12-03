'use client';

import { useParams } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { createContext, useContext, useMemo, useState } from 'react';

import { useGetBlog } from '@/features/blogs/api/get-blog';
import {
  DrafterDbEnum,
  DrafterKey,
  STEPS_CONFIG,
} from '@/features/blogs/components/drafter/drafter.config';
import { useIsMobile } from '@/hooks/use-mobile';

type DrafterContextValue = {
  storeId: string;
  blogId: string;
  steps: typeof STEPS_CONFIG;
  currentKey: DrafterKey;
  goTo: (key: DrafterKey) => void;
  goNext: () => void;
  goPrev: () => void;
  canGoTo: (key: DrafterKey) => boolean;
  isStepCompleted: (key: DrafterKey) => boolean;
  currentIndex: number;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
};

const DrafterContext = createContext<DrafterContextValue | null>(null);

const KEY_TO_INDEX = new Map(STEPS_CONFIG.map((s, i) => [s.key, i]));
const DB_ENUM_TO_INDEX = new Map(STEPS_CONFIG.map((s, i) => [s.dbEnum, i]));
const DB_ENUM_TO_KEY = new Map<DrafterDbEnum, DrafterKey>(
  STEPS_CONFIG.map((s) => [s.dbEnum, s.key]),
);

export const DrafterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { blogId, storeId } = useParams<{ storeId: string; blogId: string }>();
  if (!blogId || !storeId) throw new Error('blogId and storeId are required');

  const { data: blog } = useGetBlog({ storeId, blogId });

  const defaultKey = useMemo(() => {
    if (!blog) return STEPS_CONFIG[0].key;
    const dbStep = blog.currentStep as DrafterDbEnum;
    return DB_ENUM_TO_KEY.get(dbStep) ?? STEPS_CONFIG[0].key;
  }, [blog]);

  const [currentKey, setCurrentKey] = useQueryState(
    'view',
    parseAsString.withDefault(defaultKey),
  );

  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);

  const maxAllowedIndex = useMemo(() => {
    if (!blog) return 0;
    if (blog.currentStep === 'COMPLETED') return STEPS_CONFIG.length;
    return DB_ENUM_TO_INDEX.get(blog.currentStep as DrafterDbEnum) ?? 0;
  }, [blog]);

  const currentIndex = useMemo(() => {
    return KEY_TO_INDEX.get(currentKey as DrafterKey) ?? 0;
  }, [currentKey]);

  const goTo = (key: DrafterKey) => {
    const targetIndex = KEY_TO_INDEX.get(key) ?? 0;
    if (targetIndex <= maxAllowedIndex) {
      setCurrentKey(key);
    }
  };

  const goNext = () => {
    if (currentIndex < STEPS_CONFIG.length - 1) {
      const nextKey = STEPS_CONFIG[currentIndex + 1].key;
      setCurrentKey(nextKey);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const prevKey = STEPS_CONFIG[currentIndex - 1].key;
      setCurrentKey(prevKey);
    }
  };

  const canGoTo = (key: DrafterKey) => {
    const index = KEY_TO_INDEX.get(key) ?? 0;
    return index <= maxAllowedIndex;
  };

  const isStepCompleted = (key: DrafterKey) => {
    const index = KEY_TO_INDEX.get(key) ?? 0;
    if (!blog) return false;
    if (blog.currentStep === 'COMPLETED') return true;
    return index < maxAllowedIndex;
  };

  return (
    <DrafterContext.Provider
      value={{
        storeId,
        blogId,
        currentKey: currentKey as DrafterKey,
        steps: STEPS_CONFIG,
        isMobile,
        setOpenMobile,
        openMobile,
        goTo,
        goNext,
        goPrev,
        canGoTo,
        isStepCompleted,
        currentIndex,
      }}
    >
      {children}
    </DrafterContext.Provider>
  );
};

export const useDrafter = () => {
  const ctx = useContext(DrafterContext);
  if (!ctx) throw new Error('useDrafter must be used within DrafterProvider');
  return ctx;
};

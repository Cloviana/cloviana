'use client';

import {
  Feather,
  KeyRound,
  Heading3,
  Tags,
  Package,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useIsMobile } from '@/hooks/use-mobile';

export type DrafterKey =
  | 'topic'
  | 'primary-keyword'
  | 'title'
  | 'secondary-keywords'
  | 'product'
  | 'enhancements';

export type DrafterStep = { key: DrafterKey; title: string; icon: LucideIcon };

type DrafterContextValue = {
  steps: DrafterStep[];
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  currentKey: DrafterKey;
  completed: Record<DrafterKey, boolean>;
  canGoTo: (key: DrafterKey) => boolean;
  goTo: (key: DrafterKey) => void;
  goNext: () => void;
  goPrev: () => void;
  blogId: string;
  keyToEnum: (k: DrafterKey) => string;
  getNextStepEnum: () => string;
};

const DrafterContext = createContext<DrafterContextValue | null>(null);

const steps: DrafterStep[] = [
  { title: 'Enter a Topic', key: 'topic', icon: Feather },
  { title: 'Select a Primary Keyword', key: 'primary-keyword', icon: KeyRound },
  { title: 'Enter a Title', key: 'title', icon: Heading3 },
  { title: 'Select Secondary Keywords', key: 'secondary-keywords', icon: Tags },
  { title: 'Select a Product', key: 'product', icon: Package },
  { title: 'Enhancements', key: 'enhancements', icon: WandSparkles },
];

const order = steps.map((s) => s.key) as DrafterKey[];

const keyToEnum = {
  topic: 'TOPIC',
  'primary-keyword': 'PRIMARY_KEYWORD',
  title: 'TITLE',
  'secondary-keywords': 'SECONDARY_KEYWORDS',
  product: 'PRODUCT',
  enhancements: 'ENHANCEMENTS',
} as const;

const enumToKey = Object.fromEntries(
  Object.entries(keyToEnum).map(([k, v]) => [v, k]),
) as Record<string, DrafterKey>;

export function DrafterProvider({
  children,
  blogId,
}: {
  blogId: string;
  children: React.ReactNode;
}) {
  const { data: blog } = useGetBlog({ blogId });
  const isMobile = useIsMobile();

  const indexByKey = useMemo(
    () => new Map(order.map((k, i) => [k, i] as const)),
    [],
  );

  const currentIndex = useMemo(() => {
    if (blog?.currentStep === 'COMPLETED') return order.length - 1;
    const key = enumToKey[blog?.currentStep ?? 'TOPIC'] ?? 'topic';
    const i = indexByKey.get(key);
    return i ?? 0;
  }, [blog?.currentStep, indexByKey]);

  const completed = useMemo(() => {
    return order.reduce(
      (acc, k, i) => {
        acc[k] = blog?.currentStep === 'COMPLETED' ? true : i < currentIndex;
        return acc;
      },
      {} as Record<DrafterKey, boolean>,
    );
  }, [blog?.currentStep, currentIndex]);

  const [openMobile, setOpenMobile] = useState(false);
  const [currentKey, setCurrentKey] = useState<DrafterKey>('topic');

  useEffect(() => {
    setCurrentKey(order[currentIndex]);
  }, [currentIndex]);

  const canGoTo = (key: DrafterKey) =>
    (indexByKey.get(key) ?? 0) <= currentIndex;

  const goTo = (key: DrafterKey) => {
    if (canGoTo(key)) setCurrentKey(key);
  };

  const goNext = () => {
    const i = indexByKey.get(currentKey) ?? 0;
    setCurrentKey(order[Math.min(i + 1, currentIndex)]);
  };

  const goPrev = () => {
    const i = indexByKey.get(currentKey) ?? 0;
    setCurrentKey(order[Math.max(i - 1, 0)]);
  };

  const getNextStepEnum = () => {
    if (blog?.currentStep === 'COMPLETED') return 'COMPLETED';
    const i = indexByKey.get(currentKey) ?? 0;
    if (i >= order.length - 1) return 'COMPLETED';
    const nextKey = order[i + 1];
    return keyToEnum[nextKey];
  };

  const value: DrafterContextValue = {
    steps,
    isMobile,
    openMobile,
    setOpenMobile,
    currentKey,
    completed,
    canGoTo,
    goTo,
    goNext,
    goPrev,
    blogId,
    keyToEnum: (k) => keyToEnum[k],
    getNextStepEnum,
  };

  return (
    <DrafterContext.Provider value={value}>{children}</DrafterContext.Provider>
  );
}

export function useDrafter() {
  const ctx = useContext(DrafterContext);
  if (!ctx) throw new Error('useDrafter must be used within DrafterProvider');
  return ctx;
}

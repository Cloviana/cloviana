'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

type SubscriptionModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SubscriptionModalContext = createContext<
  SubscriptionModalContextValue | undefined
>(undefined);

export const useSubscriptionModal = () => {
  const context = useContext(SubscriptionModalContext);
  if (!context) {
    throw new Error(
      'useSubscriptionModal must be used within SubscriptionModalProvider',
    );
  }
  return context;
};

export const SubscriptionModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <SubscriptionModalContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </SubscriptionModalContext.Provider>
  );
};

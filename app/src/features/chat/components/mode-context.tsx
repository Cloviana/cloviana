'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ChatMode } from './mode-selector';

type ChatModeContextType = {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
};

const ChatModeContext = createContext<ChatModeContextType | undefined>(undefined);

export function ChatModeProvider({
  children,
  initialMode = 'auto',
}: {
  children: ReactNode;
  initialMode?: ChatMode;
}) {
  const [mode, setMode] = useState<ChatMode>(initialMode);

  return (
    <ChatModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ChatModeContext.Provider>
  );
}

export function useChatMode() {
  const context = useContext(ChatModeContext);
  if (!context) {
    // ponytail: fallback to a safe default if used outside provider
    return { mode: 'auto' as ChatMode, setMode: () => {} };
  }
  return context;
}

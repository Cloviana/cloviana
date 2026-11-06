'use client';

import { createContext, useContext } from 'react';

interface ChatActions {
  /** Turns the plan the agent just proposed into a build run. */
  approvePlan(): void;
}

const ChatActionsContext = createContext<ChatActions | null>(null);

export const ChatActionsProvider = ChatActionsContext.Provider;

export function useChatActions() {
  const actions = useContext(ChatActionsContext);
  if (!actions)
    throw new Error('useChatActions must be used inside ChatActionsProvider');
  return actions;
}

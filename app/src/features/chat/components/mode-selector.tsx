'use client';

import {
  BotIcon,
  ChevronDownIcon,
  MessageSquareTextIcon,
  PenToolIcon,
} from 'lucide-react';
import type { FC } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ChatMode = 'auto' | 'ask' | 'blog';

type ModeSelectorProps = {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
};

const modes: { value: ChatMode; label: string; icon: typeof BotIcon }[] = [
  { value: 'auto', label: 'Auto', icon: BotIcon },
  { value: 'ask', label: 'Ask', icon: MessageSquareTextIcon },
  { value: 'blog', label: 'Blog', icon: PenToolIcon },
];

export const ModeSelector: FC<ModeSelectorProps> = ({ value, onChange }) => {
  const currentMode = modes.find((m) => m.value === value) || modes[0];
  const CurrentIcon = currentMode.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-7 items-center gap-1 rounded-full border border-stone-200/80 bg-stone-50/50 px-2 py-0.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-all dark:border-stone-700/80 dark:bg-stone-900/50 dark:text-stone-400 dark:hover:text-stone-100 outline-none select-none cursor-pointer"
        >
          <CurrentIcon className="size-3.5 text-stone-500 dark:text-stone-400" />
          <span>{currentMode.label}</span>
          <ChevronDownIcon className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() => onChange(mode.value)}
              className="text-xs cursor-pointer"
            >
              <Icon className="mr-2 size-3.5" />
              {mode.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


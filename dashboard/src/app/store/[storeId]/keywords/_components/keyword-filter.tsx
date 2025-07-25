'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { AnglesUpDownIcon, CheckIcon } from '@/components/icons';
import { KeywordType } from '@/features/keywords/types';
import { cn } from '@/utils/cn';

interface KeywordFilterProps {
  type: KeywordType;
  setType: (t: KeywordType) => void;
}

export const KeywordFilter = ({ type, setType }: KeywordFilterProps) => {
  const options: KeywordType[] = ['BLOG', 'BUSINESS'];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <div className="flex h-[26px] min-w-[180px] cursor-pointer items-center justify-between gap-x-2 rounded-md border px-2.5 transition-colors hover:bg-surface-200 max-md:flex-1">
          <div className="flex items-center gap-x-1 text-xs font-medium">
            <span className="text-foreground-lighter">domain</span>
            <span className="text-foreground">{type.toLowerCase()}</span>
          </div>
          <AnglesUpDownIcon className="size-2 fill-foreground-light" />
        </div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="group w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] rounded-md border bg-white p-1 shadow-sm"
        >
          {options.map((opt) => (
            <DropdownMenu.Item
              key={opt}
              onSelect={() => setType(opt)}
              className={
                'flex cursor-pointer select-none items-center justify-between rounded px-2 py-1 text-xs outline-none hover:bg-surface-200'
              }
            >
              {opt.toLowerCase()}
              <CheckIcon
                className={cn(
                  'size-2 fill-foreground-light',
                  type === opt
                    ? 'opacity-100'
                    : 'group-hover:opacity opacity-0',
                )}
              />
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

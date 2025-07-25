'use client';

import * as Popover from '@radix-ui/react-popover';
import React, { FC, ReactElement, useState, useMemo, useCallback } from 'react';

import { cn } from '@/utils/cn';

import { LoadingSpinner } from '../animations';

import { TextField } from './text-field';

type Option = { value: string; label: string };

interface AutocompleteProps {
  textfield: ReactElement;
  options?: Option[];
  loading?: boolean;
  selected?: string[];
  onSelect?: (selected: string[]) => void;
}

const AutocompleteRoot: FC<AutocompleteProps> = ({
  textfield,
  options = [],
  loading = false,
  selected = [],
  onSelect,
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const optionCount = options.length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const resetHighlight = useCallback(() => setHighlightedIndex(0), []);

  const handleSelectValue = useCallback(
    (value: string) => {
      const next = selectedSet.has(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onSelect?.(next);
    },
    [selected, selectedSet, onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (optionCount === 0) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((i) => (i + 1) % optionCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((i) => (i - 1 + optionCount) % optionCount);
          break;
        case 'Enter':
          e.preventDefault();
          handleSelectValue(options[highlightedIndex].value);
          break;
      }
    },
    [optionCount, options, highlightedIndex, handleSelectValue],
  );

  const inputWithKeys = React.cloneElement(textfield, {
    onKeyDown: handleKeyDown,
  });

  return (
    <Popover.Root onOpenChange={(open) => open && resetHighlight()}>
      <Popover.Trigger asChild>{inputWithKeys}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={5}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="max-h-[300px] w-[var(--radix-popover-trigger-width)] overflow-y-scroll rounded-md border bg-white p-2 shadow"
        >
          <ul role="listbox" className="space-y-1">
            {options.map(({ label, value }, idx) => {
              const isSelected = selectedSet.has(value);
              const isHighlighted =
                selected.length === 0 && idx === highlightedIndex;
              return (
                <li
                  key={value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-[13px] hover:bg-surface-200/60',
                    isHighlighted && '!bg-surface-200',
                    isSelected && '!bg-surface-200 font-medium',
                  )}
                  onMouseMove={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectValue(value);
                  }}
                >
                  <span>{label}</span>
                  {isSelected && <span>✓</span>}
                </li>
              );
            })}
            {optionCount === 0 && !loading && (
              <li className="px-3 py-1.5 text-sm">No results</li>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/30 p-2 backdrop-blur-sm">
                <LoadingSpinner color="light" size="sm" />
              </div>
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export const Autocomplete = Object.assign(AutocompleteRoot, {
  TextField,
});

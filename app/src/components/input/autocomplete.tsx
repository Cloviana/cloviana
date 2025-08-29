'use client';

import React, {
  FC,
  ReactElement,
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';

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
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const optionCount = options.length;
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      if (!open || optionCount === 0) return;
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
    [open, optionCount, options, highlightedIndex, handleSelectValue],
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const input = React.cloneElement(textfield, {
    onFocus: () => {
      resetHighlight();
      setOpen(true);
    },
    onKeyDown: handleKeyDown,
  });

  return (
    <div ref={wrapperRef} className="relative">
      {input}
      {open && (
        <div className="absolute z-10 -mt-4 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow">
          <ul role="listbox" className="space-y-1 p-1">
            {options.map(({ label, value }, idx) => {
              const isSelected = selectedSet.has(value);
              const isHighlighted = idx === highlightedIndex;
              return (
                <li
                  key={value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-[13px]',
                    isHighlighted && '!bg-surface-200',
                    isSelected && '!bg-surface-200 font-medium',
                    '!hover:bg-surface-200/60',
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
              <div className="flex items-center justify-center p-2">
                <LoadingSpinner size="sm" color="light" />
              </div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export const Autocomplete = Object.assign(AutocompleteRoot, {
  TextField,
});

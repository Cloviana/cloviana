'use client';

import { ChevronDown, MessageCircle, Search } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { Anchor } from '@/components/ui/anchor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetPromptOptions } from '@/features/prompts/api/get-prompt-options';

type PromptsPickerProps = {
  businessId: string;
  /** Applied selection. The draft lives inside and resyncs from this on open. */
  value: string[];
  onValueChange: (promptIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'start' | 'end';
  /** Defaults to the filter-row style button. */
  trigger?: ReactNode;
};

export function PromptsPicker({
  businessId,
  value,
  onValueChange,
  open,
  onOpenChange,
  align = 'end',
  trigger,
}: PromptsPickerProps) {
  const {
    data: prompts = [],
    isLoading,
    isError,
  } = useGetPromptOptions(businessId);
  const [promptSearchQuery, setPromptSearchQuery] = useState('');
  const [draftPromptIds, setDraftPromptIds] = useState(value);
  const filteredPrompts = useMemo(() => {
    const normalizedQuery = promptSearchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) return prompts;

    return prompts.filter((prompt) =>
      prompt.text.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [promptSearchQuery, prompts]);
  const hasChanges =
    draftPromptIds.length !== value.length ||
    draftPromptIds.some((promptId) => !value.includes(promptId));

  useEffect(() => {
    if (!open) {
      setDraftPromptIds(value);
    }
  }, [open, value]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPromptSearchQuery('');
      setDraftPromptIds(value);
    }
    onOpenChange(nextOpen);
  };

  const handlePromptChange = (promptId: string, checked: boolean) => {
    setDraftPromptIds((currentPromptIds) =>
      checked
        ? Array.from(new Set([...currentPromptIds, promptId]))
        : currentPromptIds.filter(
            (currentPromptId) => currentPromptId !== promptId,
          ),
    );
  };

  const handleApply = () => {
    onValueChange(draftPromptIds);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm">
            <MessageCircle />
            Prompts
            {value.length > 0 && (
              <Badge variant="muted" size="sm">
                {value.length}
              </Badge>
            )}
            <ChevronDown />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-96 p-0">
        <div className="border-b p-2">
          <InputGroup size="sm">
            <InputGroupAddon size="sm">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              aria-label="Filter prompts"
              placeholder="Filter prompts..."
              value={promptSearchQuery}
              onChange={(event) => setPromptSearchQuery(event.target.value)}
              autoFocus
            />
          </InputGroup>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {isLoading ? (
            <div
              role="status"
              aria-label="Loading prompts"
              className="space-y-1"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 px-2 py-2">
                  <Skeleton className="size-4 rounded-[4px]" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="text-destructive px-2 py-3 text-sm">
              Could not load prompts.
            </p>
          ) : filteredPrompts.length ? (
            <div className="space-y-1">
              {filteredPrompts.map((prompt) => {
                const checked = draftPromptIds.includes(prompt.id);

                return (
                  <label
                    key={prompt.id}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        handlePromptChange(prompt.id, nextChecked === true)
                      }
                      aria-label={`Select ${prompt.text}`}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {prompt.text}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground px-2 py-3 text-sm">
              {promptSearchQuery.trim()
                ? 'No matching prompts.'
                : 'No prompts found.'}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t p-2">
          <Anchor href="#" variant="inherit" size="xs">
            Manage prompts
          </Anchor>
          <Button
            type="button"
            size="sm"
            disabled={!hasChanges}
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

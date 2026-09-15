'use client';

import { ChevronDown, Search, Tags } from 'lucide-react';
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
import { useGetTags } from '@/features/tags/api/get-tags';

type TagsPickerProps = {
  businessId: string;
  /** Applied selection. The draft lives inside and resyncs from this on open. */
  value: string[];
  onValueChange: (tagIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'start' | 'end';
  /** Defaults to the filter-row style button. */
  trigger?: ReactNode;
};

export function TagsPicker({
  businessId,
  value,
  onValueChange,
  open,
  onOpenChange,
  align = 'end',
  trigger,
}: TagsPickerProps) {
  const { data: tags = [], isLoading, isError } = useGetTags(businessId);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [draftTagIds, setDraftTagIds] = useState(value);
  const filteredTags = useMemo(() => {
    const normalizedQuery = tagSearchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) return tags;

    return tags.filter((tag) =>
      tag.text.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [tagSearchQuery, tags]);
  const hasChanges =
    draftTagIds.length !== value.length ||
    draftTagIds.some((tagId) => !value.includes(tagId));

  useEffect(() => {
    if (!open) {
      setDraftTagIds(value);
    }
  }, [open, value]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTagSearchQuery('');
      setDraftTagIds(value);
    }
    onOpenChange(nextOpen);
  };

  const handleTagChange = (tagId: string, checked: boolean) => {
    setDraftTagIds((currentTagIds) =>
      checked
        ? Array.from(new Set([...currentTagIds, tagId]))
        : currentTagIds.filter((currentTagId) => currentTagId !== tagId),
    );
  };

  const handleApply = () => {
    onValueChange(draftTagIds);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm">
            <Tags />
            Tags
            {value.length > 0 && (
              <Badge variant="muted" size="sm">
                {value.length}
              </Badge>
            )}
            <ChevronDown />
          </Button>
        )}
      </PopoverTrigger>
      {/* ponytail: plain div, not a form — this renders inside the create-prompt
          dialog's own form and nested forms are invalid HTML. */}
      <PopoverContent align={align} className="w-72 p-0">
        <div className="border-b p-2">
          <InputGroup size="sm">
            <InputGroupAddon size="sm">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              aria-label="Filter tags"
              placeholder="Filter tags..."
              value={tagSearchQuery}
              onChange={(event) => setTagSearchQuery(event.target.value)}
              autoFocus
            />
          </InputGroup>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {isLoading ? (
            <div role="status" aria-label="Loading tags" className="space-y-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 px-2 py-2">
                  <Skeleton className="size-4 rounded-[4px]" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="text-destructive px-2 py-3 text-sm">
              Could not load tags.
            </p>
          ) : filteredTags.length ? (
            <div className="space-y-1">
              {filteredTags.map((tag) => {
                const checked = draftTagIds.includes(tag.id);

                return (
                  <label
                    key={tag.id}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        handleTagChange(tag.id, nextChecked === true)
                      }
                      aria-label={`Select ${tag.text}`}
                    />
                    <span className="min-w-0 flex-1 truncate">{tag.text}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground px-2 py-3 text-sm">
              {tagSearchQuery.trim() ? 'No matching tags.' : 'No tags found.'}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t p-2">
          <Anchor href="#" variant="inherit" size="xs">
            Manage tags
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

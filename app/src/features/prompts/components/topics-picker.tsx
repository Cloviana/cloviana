'use client';

import { ChevronDown, ListTree, Search } from 'lucide-react';
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
import { useGetTopics } from '@/features/topics/api/get-topics';

type TopicsPickerProps = {
  businessId: string;
  /** Applied selection. The draft lives inside and resyncs from this on open. */
  value: string[];
  onValueChange: (topicIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'start' | 'end';
  /** Defaults to the filter-row style button. */
  trigger?: ReactNode;
};

export function TopicsPicker({
  businessId,
  value,
  onValueChange,
  open,
  onOpenChange,
  align = 'end',
  trigger,
}: TopicsPickerProps) {
  const { data: topics = [], isLoading, isError } = useGetTopics(businessId);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [draftTopicIds, setDraftTopicIds] = useState(value);
  const filteredTopics = useMemo(() => {
    const normalizedQuery = topicSearchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) return topics;

    return topics.filter((topic) =>
      topic.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [topicSearchQuery, topics]);
  const hasChanges =
    draftTopicIds.length !== value.length ||
    draftTopicIds.some((topicId) => !value.includes(topicId));

  useEffect(() => {
    if (!open) {
      setDraftTopicIds(value);
    }
  }, [open, value]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTopicSearchQuery('');
      setDraftTopicIds(value);
    }
    onOpenChange(nextOpen);
  };

  const handleTopicChange = (topicId: string, checked: boolean) => {
    setDraftTopicIds((currentTopicIds) =>
      checked
        ? Array.from(new Set([...currentTopicIds, topicId]))
        : currentTopicIds.filter(
            (currentTopicId) => currentTopicId !== topicId,
          ),
    );
  };

  const handleApply = () => {
    onValueChange(draftTopicIds);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm">
            <ListTree />
            Topics
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
              aria-label="Filter topics"
              placeholder="Filter topics..."
              value={topicSearchQuery}
              onChange={(event) => setTopicSearchQuery(event.target.value)}
              autoFocus
            />
          </InputGroup>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {isLoading ? (
            <div
              role="status"
              aria-label="Loading topics"
              className="space-y-1"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 px-2 py-2">
                  <Skeleton className="size-4 rounded-[4px]" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="text-destructive px-2 py-3 text-sm">
              Could not load topics.
            </p>
          ) : filteredTopics.length ? (
            <div className="space-y-1">
              {filteredTopics.map((topic) => {
                const checked = draftTopicIds.includes(topic.id);

                return (
                  <label
                    key={topic.id}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        handleTopicChange(topic.id, nextChecked === true)
                      }
                      aria-label={`Select ${topic.name}`}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {topic.name}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground px-2 py-3 text-sm">
              {topicSearchQuery.trim()
                ? 'No matching topics.'
                : 'No topics found.'}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t p-2">
          <Anchor href="#" variant="inherit" size="xs">
            Manage topics
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

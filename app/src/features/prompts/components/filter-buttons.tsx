'use client';

import { useState } from 'react';

import { PromptsPicker } from '@/features/prompts/components/prompts-picker';
import { TagsPicker } from '@/features/prompts/components/tags-picker';
import { TopicsPicker } from '@/features/prompts/components/topics-picker';
import { useUrlListParam } from '@/hooks/use-url-list-param';

/** Prompt/topic/tag filters shared by the list views that use them. */

export function PromptsFilterButton({ businessId }: { businessId: string }) {
  const [promptIds, setPromptIds] = useUrlListParam('promptIds');
  const [open, setOpen] = useState(false);

  return (
    <PromptsPicker
      businessId={businessId}
      value={promptIds}
      onValueChange={setPromptIds}
      open={open}
      onOpenChange={setOpen}
    />
  );
}

export function TopicsFilterButton({ businessId }: { businessId: string }) {
  const [topicIds, setTopicIds] = useUrlListParam('topicIds');
  const [open, setOpen] = useState(false);

  return (
    <TopicsPicker
      businessId={businessId}
      value={topicIds}
      onValueChange={setTopicIds}
      open={open}
      onOpenChange={setOpen}
    />
  );
}

export function TagsFilterButton({ businessId }: { businessId: string }) {
  const [tagIds, setTagIds] = useUrlListParam('tagIds');
  const [open, setOpen] = useState(false);

  return (
    <TagsPicker
      businessId={businessId}
      value={tagIds}
      onValueChange={setTagIds}
      open={open}
      onOpenChange={setOpen}
    />
  );
}

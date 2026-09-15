'use client';

import { ChevronRight, Plus, X } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePrompt } from '@/features/prompts/api/create-prompt';
import { getPromptError } from '@/features/prompts/api/prompt-error';
import { TagsPicker } from '@/features/prompts/components/tags-picker';
import { TopicsPicker } from '@/features/prompts/components/topics-picker';
import { brandingOptions, stageOptions } from '@/features/prompts/options';
import type { PromptBranding, PromptStage } from '@/features/prompts/types';
import { useGetTags } from '@/features/tags/api/get-tags';
import { useGetTopics } from '@/features/topics/api/get-topics';

const MAX_PROMPT_LENGTH = 2000;

type CreatePromptDialogProps = {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RemovableBadgeProps = {
  disabled: boolean;
  label: string;
  onRemove: () => void;
};

function RemovableBadge({ disabled, label, onRemove }: RemovableBadgeProps) {
  return (
    <Badge variant="muted" size="sm" className="gap-1 pr-1">
      {label}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={disabled}
        onClick={onRemove}
        className="size-3.5 rounded-full"
        aria-label={`Remove ${label}`}
      >
        <X className="size-3" />
      </Button>
    </Badge>
  );
}

export function CreatePromptDialog({
  businessId,
  open,
  onOpenChange,
}: CreatePromptDialogProps) {
  const textId = useId();
  const brandingId = useId();
  const stageId = useId();
  const statusId = useId();
  const [text, setText] = useState('');
  const [branding, setBranding] = useState<PromptBranding | ''>('');
  const [stage, setStage] = useState<PromptStage | ''>('');
  const [active, setActive] = useState(false);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const { data: topics = [] } = useGetTopics(businessId);
  const { data: tags = [] } = useGetTags(businessId);
  const createPrompt = useCreatePrompt();
  const isPending = createPrompt.isPending;
  const canSubmit = Boolean(text.trim() && branding && stage);

  useEffect(() => {
    if (!open) return;

    setText('');
    setBranding('');
    setStage('');
    setActive(false);
    setTopicIds([]);
    setTagIds([]);
    setAdvancedOpen(false);
    setTopicsOpen(false);
    setTagsOpen(false);
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isPending || !branding || !stage) return;

    createPrompt.mutate(
      {
        businessId,
        text: text.trim(),
        branding,
        stage,
        active,
        ...(topicIds.length ? { topicIds } : {}),
        ...(tagIds.length ? { tagIds } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Prompt created');
          onOpenChange(false);
        },
        onError: (error: Error) => {
          toast.error(getPromptError(error, 'Could not create prompt'));
        },
      },
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isPending) onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[680px]"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create prompt</DialogTitle>
          <DialogDescription>
            Monitor how AI platforms respond to this prompt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} aria-busy={isPending || undefined}>
          <DialogBody>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor={textId}>Prompt</FieldLabel>
                <Textarea
                  id={textId}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={MAX_PROMPT_LENGTH}
                  rows={3}
                  autoFocus
                  disabled={isPending}
                  placeholder="e.g. What are the best expense management tools?"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={brandingId}>Prompt type</FieldLabel>
                  <Select
                    value={branding}
                    disabled={isPending}
                    onValueChange={(value) =>
                      setBranding(value as PromptBranding)
                    }
                  >
                    <SelectTrigger id={brandingId} className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="w-(--radix-select-trigger-width)">
                      {brandingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor={stageId}>Buyer stage</FieldLabel>
                  <Select
                    value={stage}
                    disabled={isPending}
                    onValueChange={(value) => setStage(value as PromptStage)}
                  >
                    <SelectTrigger id={stageId} className="w-full">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent className="w-(--radix-select-trigger-width)">
                      {stageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="group text-foreground-light -ml-2"
                  >
                    Advanced
                    <ChevronRight className="transition-transform group-data-[state=open]:rotate-90" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-3">
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor={statusId}>
                      Enable monitoring
                    </FieldLabel>
                    <Switch
                      id={statusId}
                      checked={active}
                      onCheckedChange={setActive}
                      disabled={isPending}
                    />
                  </Field>

                  <Field>
                    <FieldTitle>Topics</FieldTitle>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {topics
                        .filter((topic) => topicIds.includes(topic.id))
                        .map((topic) => (
                          <RemovableBadge
                            key={topic.id}
                            label={topic.name}
                            disabled={isPending}
                            onRemove={() =>
                              setTopicIds((currentIds) =>
                                currentIds.filter((id) => id !== topic.id),
                              )
                            }
                          />
                        ))}
                      <TopicsPicker
                        businessId={businessId}
                        value={topicIds}
                        onValueChange={setTopicIds}
                        open={topicsOpen}
                        onOpenChange={setTopicsOpen}
                        align="start"
                        trigger={
                          <Button
                            type="button"
                            variant="dashed"
                            size="xs"
                            disabled={isPending}
                          >
                            <Plus />
                            Add topics
                          </Button>
                        }
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldTitle>Tags</FieldTitle>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {tags
                        .filter((tag) => tagIds.includes(tag.id))
                        .map((tag) => (
                          <RemovableBadge
                            key={tag.id}
                            label={tag.text}
                            disabled={isPending}
                            onRemove={() =>
                              setTagIds((currentIds) =>
                                currentIds.filter((id) => id !== tag.id),
                              )
                            }
                          />
                        ))}
                      <TagsPicker
                        businessId={businessId}
                        value={tagIds}
                        onValueChange={setTagIds}
                        open={tagsOpen}
                        onOpenChange={setTagsOpen}
                        align="start"
                        trigger={
                          <Button
                            type="button"
                            variant="dashed"
                            size="xs"
                            disabled={isPending}
                          >
                            <Plus />
                            Add tags
                          </Button>
                        }
                      />
                    </div>
                  </Field>
                </CollapsibleContent>
              </Collapsible>
            </FieldGroup>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={isPending} disabled={!canSubmit}>
              Create prompt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

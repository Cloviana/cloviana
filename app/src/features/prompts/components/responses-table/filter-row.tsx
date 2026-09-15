'use client';

import {
  Claude,
  Gemini,
  OpenAI,
  Perplexity,
  type IconType,
} from '@lobehub/icons';
import { Bot, ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { engineOptions } from '@/features/prompts/options';
import type { AiEngine } from '@/features/prompts/types';
import { useUrlListParam } from '@/hooks/use-url-list-param';

import {
  PromptsFilterButton,
  TagsFilterButton,
  TopicsFilterButton,
} from '../filter-buttons';

const ENGINE_ICONS: Record<AiEngine, IconType> = {
  CHATGPT: OpenAI,
  CLAUDE: Claude.Color,
  PERPLEXITY: Perplexity.Color,
  AI_OVERVIEWS: Gemini.Color,
};

/** Engines are a plain multi-select: each click applies straight away. */
function EnginesFilterButton() {
  const [engines, setEngines] = useUrlListParam('engines');

  const toggleEngine = (engine: string, checked: boolean) => {
    setEngines(
      checked
        ? Array.from(new Set([...engines, engine]))
        : engines.filter((current) => current !== engine),
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Bot />
          Platforms
          {engines.length > 0 && (
            <Badge variant="muted" size="sm">
              {engines.length}
            </Badge>
          )}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="space-y-0.5">
          {engineOptions.map((option) => {
            const EngineIcon = ENGINE_ICONS[option.value];

            return (
              <label
                key={option.value}
                className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
              >
                <Checkbox
                  checked={engines.includes(option.value)}
                  onCheckedChange={(checked) =>
                    toggleEngine(option.value, checked === true)
                  }
                  aria-label={`Filter by ${option.label}`}
                />
                <EngineIcon
                  size={16}
                  className="shrink-0"
                  aria-label={option.label}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ResponsesFilterRow() {
  const { businessId } = useParams<{ businessId: string }>();

  return (
    <div className="bg-surface flex shrink-0 items-center justify-end px-3 py-2.5">
      <div className="flex items-center gap-1">
        <PromptsFilterButton businessId={businessId} />
        <TopicsFilterButton businessId={businessId} />
        <TagsFilterButton businessId={businessId} />
        <EnginesFilterButton />
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { FC, useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

type AnswerSegment = {
  text: string;
  competitor?: boolean;
};

type AIPlatform = {
  name: string;
  iconSrc: string;
};

type BuyerPrompt = {
  platform: AIPlatform;
  prompt: string;
  answerSegments: AnswerSegment[];
};

const AI_PLATFORMS = {
  chatgpt: { name: 'ChatGPT', iconSrc: '/logos/chatgpt-icon.svg' },
  perplexity: { name: 'Perplexity', iconSrc: '/logos/perplexity-color.svg' },
  claude: { name: 'Claude', iconSrc: '/logos/claude-color.svg' },
  copilot: { name: 'Copilot', iconSrc: '/logos/copilot-color.svg' },
  aiOverviews: { name: 'AI Overviews', iconSrc: '/logos/google-aio-icon.svg' },
};

const BUYER_PROMPTS: BuyerPrompt[] = [
  {
    platform: AI_PLATFORMS.chatgpt,
    prompt:
      'What are the best CRM tools for a B2B SaaS company with a small sales team?',
    answerSegments: [
      { text: 'For a small B2B SaaS sales team, common CRM options include ' },
      { text: 'HubSpot', competitor: true },
      { text: ', ' },
      { text: 'Salesforce', competitor: true },
      { text: ', ' },
      { text: 'Pipedrive', competitor: true },
      { text: ', ' },
      { text: 'Zoho CRM', competitor: true },
      { text: ', ' },
      { text: 'Close', competitor: true },
      { text: ', and ' },
      { text: 'Attio', competitor: true },
      {
        text: '. HubSpot is often easiest to start with, while Salesforce fits teams that need deeper customization.',
      },
    ],
  },
  {
    platform: AI_PLATFORMS.perplexity,
    prompt: 'Which CRM is easiest to implement without a dedicated ops team?',
    answerSegments: [
      { text: 'Teams that want a fast rollout often compare ' },
      { text: 'HubSpot', competitor: true },
      { text: ', ' },
      { text: 'Pipedrive', competitor: true },
      { text: ', ' },
      { text: 'Close', competitor: true },
      { text: ', and ' },
      { text: 'Folk', competitor: true },
      {
        text: '. These tools are commonly picked when setup speed matters more than deep enterprise configuration.',
      },
    ],
  },
  {
    platform: AI_PLATFORMS.claude,
    prompt:
      'What CRM should a founder-led sales team use before hiring RevOps?',
    answerSegments: [
      { text: 'Founder-led teams usually shortlist ' },
      { text: 'Attio', competitor: true },
      { text: ', ' },
      { text: 'HubSpot', competitor: true },
      { text: ', ' },
      { text: 'Close', competitor: true },
      { text: ', and ' },
      { text: 'Pipedrive', competitor: true },
      {
        text: ' because they balance pipeline visibility, email workflows, and low admin overhead.',
      },
    ],
  },
  {
    platform: AI_PLATFORMS.copilot,
    prompt: 'Best CRM for tracking outbound sales and follow-ups?',
    answerSegments: [
      { text: 'Outbound-heavy teams often evaluate ' },
      { text: 'Close', competitor: true },
      { text: ', ' },
      { text: 'Pipedrive', competitor: true },
      { text: ', ' },
      { text: 'Salesforce', competitor: true },
      { text: ', and ' },
      { text: 'HubSpot', competitor: true },
      {
        text: ' when they need pipeline tracking, calling, sequences, and clear follow-up workflows.',
      },
    ],
  },
  {
    platform: AI_PLATFORMS.aiOverviews,
    prompt: 'CRM alternatives to HubSpot for early-stage SaaS companies',
    answerSegments: [
      { text: 'Popular HubSpot alternatives for early-stage SaaS include ' },
      { text: 'Attio', competitor: true },
      { text: ', ' },
      { text: 'Pipedrive', competitor: true },
      { text: ', ' },
      { text: 'Close', competitor: true },
      { text: ', ' },
      { text: 'Zoho CRM', competitor: true },
      { text: ', and ' },
      { text: 'Folk', competitor: true },
      {
        text: ', depending on whether the team cares most about speed, cost, or workflow flexibility.',
      },
    ],
  },
];

const ANSWER_OPEN_DELAY = 900;
const HIGHLIGHT_START_DELAY = 520;
const HIGHLIGHT_STEP_DELAY = 260;
const LOOP_PAUSE_DELAY = 1900;
const ANSWER_CLOSE_DELAY = 560;
const LOOP_RESTART_DELAY = 450;
const PROMPT_FROST_DELAY = 360;
const PROMPT_UNFROST_DELAY = 140;

export const AIAnswerMonitorPreview: FC = () => {
  const [promptIndex, setPromptIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [activeCompetitors, setActiveCompetitors] = useState(0);
  const [isChangingPrompt, setIsChangingPrompt] = useState(false);
  const currentPrompt = BUYER_PROMPTS[promptIndex] ?? BUYER_PROMPTS[0]!;

  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let isActive = true;
    let nextPromptIndex = 0;

    const queue = (callback: () => void, delay: number) => {
      const timeoutId = setTimeout(() => {
        if (isActive) callback();
      }, delay);
      timeoutIds.push(timeoutId);
    };

    const runLoop = () => {
      if (!isActive) return;

      const prompt = BUYER_PROMPTS[nextPromptIndex] ?? BUYER_PROMPTS[0]!;
      const competitorCount = prompt.answerSegments.filter(
        (segment) => segment.competitor,
      ).length;

      setPromptIndex(nextPromptIndex);
      setShowAnswer(false);
      setActiveCompetitors(0);

      queue(() => {
        setShowAnswer(true);

        for (let index = 1; index <= competitorCount; index++) {
          queue(
            () => setActiveCompetitors(index),
            HIGHLIGHT_START_DELAY + index * HIGHLIGHT_STEP_DELAY,
          );
        }

        const closeDelay =
          HIGHLIGHT_START_DELAY +
          competitorCount * HIGHLIGHT_STEP_DELAY +
          LOOP_PAUSE_DELAY;
        const restartDelay =
          closeDelay + ANSWER_CLOSE_DELAY + LOOP_RESTART_DELAY;

        queue(() => setShowAnswer(false), closeDelay);
        queue(() => {
          setActiveCompetitors(0);
          setIsChangingPrompt(true);

          queue(() => {
            nextPromptIndex = (nextPromptIndex + 1) % BUYER_PROMPTS.length;
            runLoop();
            queue(() => setIsChangingPrompt(false), PROMPT_UNFROST_DELAY);
          }, PROMPT_FROST_DELAY);
        }, restartDelay);
      }, ANSWER_OPEN_DELAY);
    };

    runLoop();

    return () => {
      isActive = false;
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex w-full max-w-[340px] flex-col gap-2 sm:max-w-[420px] sm:gap-2.5 md:max-w-[460px] md:gap-3 lg:max-w-[520px] lg:gap-3.5">
      <PromptBubble prompt={currentPrompt} isChanging={isChangingPrompt} />
      <AnswerBubble
        segments={currentPrompt.answerSegments}
        activeCompetitors={activeCompetitors}
        isVisible={showAnswer}
      />
    </div>
  );
};

const PromptBubble: FC<{ prompt: BuyerPrompt; isChanging: boolean }> = ({
  prompt,
  isChanging,
}) => (
  <div className="relative flex min-w-0 items-start gap-2 overflow-hidden rounded-xl border border-black/8 bg-white px-2.5 py-2 sm:items-center sm:gap-2.5 sm:px-3.5 sm:py-3 md:gap-3 md:px-4 md:py-3.5 lg:gap-3.5 lg:px-5 lg:py-4">
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-lg border border-black/6 bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:size-8 md:size-9 lg:size-10',
        isChanging ? 'scale-[0.98] blur-[2px]' : 'blur-0 scale-100',
      )}
    >
      <Image
        src={prompt.platform.iconSrc}
        alt={prompt.platform.name}
        width={22}
        height={22}
        className="size-4.5 object-contain sm:size-5 md:size-5.5 lg:size-6"
      />
    </span>
    <p
      className={cn(
        'min-w-0 text-xs leading-snug break-words text-[#1d1c1d] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-[13px] md:text-sm md:leading-normal lg:text-base lg:leading-snug',
        isChanging ? 'translate-y-0.5 blur-[2px]' : 'blur-0 translate-y-0',
      )}
    >
      {prompt.prompt}
    </p>
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-px rounded-[11px] bg-white/70 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isChanging ? 'opacity-100' : 'opacity-0',
      )}
    />
  </div>
);

const AnswerBubble: FC<{
  segments: AnswerSegment[];
  activeCompetitors: number;
  isVisible: boolean;
}> = ({ segments, activeCompetitors, isVisible }) => {
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isVisible
          ? 'max-h-80 translate-y-0 opacity-100 sm:max-h-64 md:max-h-56 lg:max-h-52'
          : 'max-h-0 translate-y-1 opacity-0',
      )}
    >
      <div
        className="rounded-xl border border-black/8 bg-white px-2.5 py-2 text-xs leading-relaxed break-words text-[#1d1c1d] sm:px-3.5 sm:py-3 sm:text-[13px] md:px-4 md:py-3.5 md:text-sm md:leading-relaxed lg:px-5 lg:py-4 lg:text-base"
        aria-hidden={!isVisible}
      >
        {segments.map((segment, index) => {
          if (!segment.competitor)
            return <span key={index}>{segment.text}</span>;
          const competitorIndex = segments
            .slice(0, index + 1)
            .filter((previousSegment) => previousSegment.competitor).length;

          return (
            <HighlightedCompetitor
              key={index}
              isActive={competitorIndex <= activeCompetitors}
              name={segment.text}
            />
          );
        })}
      </div>
    </div>
  );
};

const HighlightedCompetitor: FC<{ name: string; isActive: boolean }> = ({
  name,
  isActive,
}) => (
  <span
    className="rounded-[3px] px-0.5 transition-[background-size] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
    style={{
      backgroundImage:
        'linear-gradient(rgba(168, 211, 240, 0.7), rgba(168, 211, 240, 0.7))',
      backgroundPosition: 'left center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: isActive ? '100% 100%' : '0% 100%',
    }}
  >
    {name}
  </span>
);

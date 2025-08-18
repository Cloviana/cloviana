import * as Tooltip from '@radix-ui/react-tooltip';

import { InformationIcon } from '@/components/icons';
import { KeywordType } from '@/features/keywords/types';

const BUSINESS_KEYWORD_DEFINITION =
  'Your business keyword is the central focus for optimizing your online presence. It serves as the primary term to ensure your business is effectively represented and reaches the right audience.';
const BLOG_KEYWORD_DEFINITION =
  'Blog keywords are essential for driving new traffic to your site. We identify key terms around which to create blog content, ensuring that your business attracts and engages a wider audience through targeted, relevant topics.';

interface Props {
  type: KeywordType;
}

export const KeywordInfo = ({ type }: Props) => {
  const definition =
    type === 'BUSINESS' ? BUSINESS_KEYWORD_DEFINITION : BLOG_KEYWORD_DEFINITION;

  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <button className="flex size-[26px] items-center justify-center rounded-md border border-dashed p-1.5 outline-none transition-colors hover:bg-surface-200">
            <InformationIcon className="h-full fill-foreground-light" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content
          className="z-10 max-w-[300px] rounded-md border bg-white p-2 shadow-md"
          side="bottom"
          sideOffset={4}
        >
          <p className="text-center text-xs text-foreground">{definition}</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

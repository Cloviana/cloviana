import { getDateDisplayLabel } from '@platejs/date';
import type { TDateElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';

import { inlineSuggestionVariants } from '@/lib/suggestion';
import { cn } from '@/utils/cn';

export function DateElementStatic(props: SlateElementProps<TDateElement>) {
  const { element } = props;

  return (
    <SlateElement as="span" className="inline-block" {...props}>
      <span
        className={cn(
          'bg-muted text-muted-foreground w-fit rounded-sm px-1',
          inlineSuggestionVariants(),
        )}
      >
        {element.date || element.rawDate ? (
          getDateDisplayLabel(element)
        ) : (
          <span>Pick a date</span>
        )}
      </span>
      {props.children}
    </SlateElement>
  );
}

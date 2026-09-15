import { getLinkAttributes } from '@platejs/link';
import type { TLinkElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';

import { inlineSuggestionVariants } from '@/lib/suggestion';
import { cn } from '@/utils/cn';

export function LinkElementStatic(props: SlateElementProps<TLinkElement>) {
  return (
    <SlateElement
      {...props}
      as="a"
      className={cn(
        'text-primary decoration-primary font-medium underline underline-offset-4',
        inlineSuggestionVariants(),
      )}
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
      }}
    >
      {props.children}
    </SlateElement>
  );
}

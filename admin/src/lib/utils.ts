import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Keep composite typography separate from colour utilities when merging classes.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'body',
            'body-small',
            'body-large',
            'code',
            'heading-xxlarge',
            'heading-xlarge',
            'heading-large',
            'heading-medium',
            'heading-small',
            'heading-xsmall',
            'heading-xxsmall',
            'metric-large',
            'metric-medium',
            'metric-small',
          ],
        },
      ],
      'border-w': [{ border: ['line'] }],
      'border-w-x': [{ 'border-x': ['line'] }],
      'border-w-y': [{ 'border-y': ['line'] }],
      'border-w-t': [{ 'border-t': ['line'] }],
      'border-w-r': [{ 'border-r': ['line'] }],
      'border-w-b': [{ 'border-b': ['line'] }],
      'border-w-l': [{ 'border-l': ['line'] }],
      'border-w-s': [{ 'border-s': ['line'] }],
      'border-w-e': [{ 'border-e': ['line'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import type { AgentMode } from '../../types';

/** Things worth trying, shown on an empty conversation. They depend on what each mode is for. */
export const SUGGESTIONS: Record<AgentMode, readonly string[]> = {
  BUILD: [
    'Make the homepage heading larger and add a short subheading',
    'Add a footer with links to the cart and contact',
    'Change the main color to a deep blue',
  ],
  PLAN: ['Plan a redesign of the homepage', 'Plan how to add a product grid'],
  CHAT: [
    'How is the cart page built?',
    'Where are the colors and fonts defined?',
  ],
};

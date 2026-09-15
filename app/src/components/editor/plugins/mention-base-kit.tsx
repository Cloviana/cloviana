import { BaseMentionPlugin } from '@platejs/mention';

import { MentionElementStatic } from '@/components/editor/components/nodes/mention-node-static';

export const BaseMentionKit = [
  BaseMentionPlugin.withComponent(MentionElementStatic),
];

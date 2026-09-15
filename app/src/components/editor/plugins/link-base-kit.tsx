import { BaseLinkPlugin } from '@platejs/link';

import { LinkElementStatic } from '@/components/editor/components/nodes/link-node-static';

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)];

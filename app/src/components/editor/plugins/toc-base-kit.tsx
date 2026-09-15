import { BaseTocPlugin } from '@platejs/toc';

import { TocElementStatic } from '@/components/editor/components/nodes/toc-node-static';

export const BaseTocKit = [BaseTocPlugin.withComponent(TocElementStatic)];

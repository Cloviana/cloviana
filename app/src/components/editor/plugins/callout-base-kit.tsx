import { BaseCalloutPlugin } from '@platejs/callout';

import { CalloutElementStatic } from '@/components/editor/components/nodes/callout-node-static';

export const BaseCalloutKit = [
  BaseCalloutPlugin.withComponent(CalloutElementStatic),
];

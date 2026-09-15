import { BaseDatePlugin } from '@platejs/date';

import { DateElementStatic } from '@/components/editor/components/nodes/date-node-static';

export const BaseDateKit = [BaseDatePlugin.withComponent(DateElementStatic)];

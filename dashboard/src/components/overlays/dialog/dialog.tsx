import { Root, Portal, Trigger, Close } from '@radix-ui/react-dialog';

import { ActionGroup } from './components/action-group';
import { Content } from './components/content';
import { Overlay } from './components/overlay';
import { Section } from './components/section';
import { Title } from './components/title';

export const Dialog = Object.assign(Root, {
  Portal,
  Overlay,
  Trigger,
  Content,
  Section,
  Title,
  Close,
  ActionGroup,
});

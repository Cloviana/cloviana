import { Close } from '@radix-ui/react-dialog';
import { FC } from 'react';

import { ButtonGroup } from '@/components/actions';
import { Button, ButtonProps } from '@/components/legacy';

interface ActionGroupProps {
  primaryAction: ButtonProps;
  secondaryAction: ButtonProps;
}

export const ActionGroup: FC<ActionGroupProps> = ({
  primaryAction,
  secondaryAction,
}) => (
  <div className="flex w-full items-center justify-end">
    <ButtonGroup gap="tight">
      <Close asChild>
        <Button variant={'secondary'} size="sm" {...secondaryAction} />
      </Close>
      <Button variant={'primary'} size="sm" {...primaryAction} />
    </ButtonGroup>
  </div>
);

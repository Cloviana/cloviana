import { FC } from 'react';

import { Button, ButtonProps } from '@/components/deprecated/legacy';

import { ButtonGroup } from './button-group';

interface PageActionsProps {
  primaryAction?: ButtonProps;
  secondaryActions?: ButtonProps[];
}

export const PageActions: FC<PageActionsProps> = ({
  primaryAction,
  secondaryActions = [],
}) => {
  return (
    <div className="flex w-full justify-end py-4">
      <ButtonGroup gap="tight">
        {secondaryActions.map(({ children, ...props }, i) => (
          <Button key={i} variant="secondary" size="sm" {...props}>
            {children}
          </Button>
        ))}

        {primaryAction && (
          <Button variant="primary" size="sm" {...primaryAction}>
            {primaryAction.children}
          </Button>
        )}
      </ButtonGroup>
    </div>
  );
};

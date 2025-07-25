import { FC } from 'react';

import { Button } from './button';
import { ButtonGroup } from './button-group';

export interface PageAction {
  content: string;
  loading?: boolean;
  disabled?: boolean;
  url?: string;
  onClick?: () => void;
  [key: string]: any;
}

interface PageActionsProps {
  primaryAction?: PageAction;
  secondaryActions?: PageAction[];
}

export const PageActions: FC<PageActionsProps> = ({
  primaryAction,
  secondaryActions = [],
}) => {
  const { content: primaryContent, ...primaryProps } = primaryAction || {};

  return (
    <div className="flex w-full justify-end py-4">
      <ButtonGroup gap="tight">
        {secondaryActions.map(({ content, ...props }, i) => (
          <Button key={i} variant="secondary" size="sm" {...props}>
            {content}
          </Button>
        ))}

        {primaryAction && (
          <Button variant="primary" size="sm" {...primaryProps}>
            {primaryContent}
          </Button>
        )}
      </ButtonGroup>
    </div>
  );
};

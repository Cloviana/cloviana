import { FC } from 'react';

import { formatDateToMonthDate } from '@/utils/format';

interface IBasicRendererProps {
  value: string;
  emptyText: string;
  type?: 'text' | 'datestring' | 'uppercase';
}
const BasicCellRenderer: FC<IBasicRendererProps> = ({
  value,
  emptyText,
  type = 'text',
}) => {
  if (!value || value === '')
    return (
      <span className="text-xs font-normal italic text-foreground-light">
        {emptyText}
      </span>
    );
  if (type === 'datestring')
    return (
      <span className="text-xs font-normal text-foreground-light">
        {formatDateToMonthDate(value)}
      </span>
    );
  if (type === 'uppercase')
    return (
      <span className="text-xs font-normal capitalize text-foreground-light">
        {value.toLowerCase()}
      </span>
    );
  return (
    <span className="text-xs font-normal text-foreground-light">{value}</span>
  );
};

export default BasicCellRenderer;

'use client';

import { cva, VariantProps } from 'class-variance-authority';
import {
  FC,
  ReactNode,
  createContext,
  useContext,
  ReactElement,
  Children,
  cloneElement,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

const alignVariants = cva('flex', {
  variants: {
    alignment: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    alignment: 'start',
  },
});

type Alignment = VariantProps<typeof alignVariants>['alignment'];
type SortDirection = 'asc' | 'desc' | null;

// Sort configuration types
export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface SortableConfig {
  key: string;
  sortType: 'string' | 'number' | 'date';
  sortFn?: (a: any, b: any, direction: 'asc' | 'desc') => number;
  getValue?: (item: any) => any;
}

type Heading = {
  title: string;
  alignment?: Alignment;
  width?: string | number;
  className?: string;
  sortable?: boolean | SortableConfig;
};

interface RootProps {
  headings: Heading[];
  children?: ReactNode;
  customHeader?: ReactNode;
  data?: any[];
  onSort?: (sortConfig: SortConfig | null) => void;
  defaultSort?: SortConfig;
}

interface RowProps {
  children: ReactNode;
  id: string;
  onNavigation?: (id: string) => void;
}

interface CellProps {
  children: ReactNode;
  alignment?: Alignment;
}

// Context for alignments and sorting
const AlignmentsCtx = createContext<Alignment[]>([]);
const SortingCtx = createContext<{
  sortConfig: SortConfig | null;
  handleSort: (columnKey: string, sortableConfig?: SortableConfig) => void;
}>({
  sortConfig: null,
  handleSort: () => {},
});

const defaultSortFunctions: Record<
  SortableConfig['sortType'],
  (a: any, b: any, direction: 'asc' | 'desc') => number
> = {
  string: (a: any, b: any, direction: 'asc' | 'desc') => {
    const aVal = String(a || '').toLowerCase();
    const bVal = String(b || '').toLowerCase();
    const result = aVal.localeCompare(bVal);
    return direction === 'asc' ? result : -result;
  },
  number: (a: any, b: any, direction: 'asc' | 'desc') => {
    const aVal = Number(a) || 0;
    const bVal = Number(b) || 0;
    const result = aVal - bVal;
    return direction === 'asc' ? result : -result;
  },
  date: (a: any, b: any, direction: 'asc' | 'desc') => {
    const aVal = new Date(a).getTime() || 0;
    const bVal = new Date(b).getTime() || 0;
    const result = aVal - bVal;
    return direction === 'asc' ? result : -result;
  },
};

const SortIcon: FC<{ direction: SortDirection; isActive: boolean }> = ({
  direction,
  isActive,
}) => {
  return (
    <div
      className={cn(
        'ml-1.5 items-center justify-center text-foreground-lighter transition-all duration-300 ease-in-out',
        isActive ? 'opacity-100' : 'opacity-40',
      )}
    >
      <div
        className={cn(
          'transition-transform duration-300 ease-in-out',
          direction === 'asc' && isActive && '-scale-y-100',
          direction === 'desc' && isActive && 'scale-y-100',
        )}
      >
        <GIcon size={11} name="south" />
      </div>
    </div>
  );
};

const SortableHeader: FC<{
  title: string;
  columnKey: string;
  sortableConfig?: SortableConfig;
  alignment?: Alignment;
  className?: string;
}> = ({ title, columnKey, sortableConfig, alignment, className }) => {
  const { sortConfig, handleSort } = useContext(SortingCtx);
  const isActive = sortConfig?.key === columnKey;
  const direction = isActive ? sortConfig.direction : null;

  const handleClick = useCallback(() => {
    handleSort(columnKey, sortableConfig);
  }, [columnKey, sortableConfig, handleSort]);

  return (
    <button
      type="button"
      className={cn(
        'group flex w-fit items-center rounded px-2 py-1 transition-colors hover:bg-surface-300/50',
        className,
      )}
      onClick={handleClick}
    >
      <div className={alignVariants({ alignment })}>{title}</div>
      <SortIcon direction={direction} isActive={isActive} />
    </button>
  );
};

// Custom hook for sorting logic
const useSorting = (
  headings: Heading[],
  onSort?: (sortConfig: SortConfig | null) => void,
  defaultSort?: SortConfig,
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    defaultSort || null,
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      const newDirection: SortDirection =
        sortConfig?.key === columnKey
          ? sortConfig.direction === 'asc'
            ? 'desc'
            : sortConfig.direction === 'desc'
              ? null
              : 'asc'
          : 'asc';

      const newSortConfig = newDirection
        ? { key: columnKey, direction: newDirection }
        : null;

      setSortConfig(newSortConfig);
      onSort?.(newSortConfig);
    },
    [sortConfig, onSort],
  );

  const sortedData = useMemo(() => {
    const data: any[] = [];
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;
    const heading = headings.find((h) => {
      if (typeof h.sortable === 'object') {
        return h.sortable.key === key;
      }
      return false;
    });

    const sortableConfig =
      typeof heading?.sortable === 'object' ? heading.sortable : undefined;

    if (!sortableConfig) return data;

    return [...data].sort((a, b) => {
      let aValue = a;
      let bValue = b;

      if (sortableConfig?.getValue) {
        aValue = sortableConfig.getValue(a);
        bValue = sortableConfig.getValue(b);
      } else {
        aValue = a[key];
        bValue = b[key];
      }

      if (sortableConfig?.sortFn) {
        return sortableConfig.sortFn(aValue, bValue, direction!);
      }

      return defaultSortFunctions[sortableConfig.sortType](
        aValue,
        bValue,
        direction!,
      );
    });
  }, [sortConfig, headings]);

  return {
    sortConfig,
    handleSort,
    sortedData,
  };
};

const Root: FC<RootProps> = ({
  headings,
  children,
  customHeader,

  onSort,
  defaultSort,
}) => {
  const aligns = headings.map((h) => h.alignment ?? 'start');
  const { sortConfig, handleSort } = useSorting(headings, onSort, defaultSort);

  return (
    <SortingCtx.Provider value={{ sortConfig, handleSort }}>
      <div className="w-full">
        {customHeader && (
          <div className="border-b border-surface-300 bg-white">
            <div className="px-4 py-2 md:px-8">{customHeader}</div>
          </div>
        )}
        <table className="w-full">
          <thead className="border-b border-surface-300 bg-white">
            <tr>
              {headings.map(
                ({ title, alignment, width, className, sortable }, idx) => {
                  const columnKey =
                    typeof sortable === 'object'
                      ? sortable.key
                      : `column_${idx}`;
                  const sortableConfig =
                    typeof sortable === 'object' ? sortable : undefined;

                  return (
                    <th
                      key={idx}
                      className={cn(
                        'px-4 py-2 text-[12px] font-normal text-foreground-light md:px-8',
                        className,
                      )}
                      style={{ width: width || 'auto' }}
                    >
                      {sortable ? (
                        <SortableHeader
                          title={title}
                          columnKey={columnKey}
                          sortableConfig={sortableConfig}
                          alignment={alignment}
                        />
                      ) : (
                        <div className={alignVariants({ alignment })}>
                          {title}
                        </div>
                      )}
                    </th>
                  );
                },
              )}
            </tr>
          </thead>
          <AlignmentsCtx.Provider value={aligns}>
            <tbody className="divide-y divide-border">{children}</tbody>
          </AlignmentsCtx.Provider>
        </table>
      </div>
    </SortingCtx.Provider>
  );
};

const Row: FC<RowProps> = ({ children, id, onNavigation }) => {
  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const hasPrimaryLink = Boolean(
      e.currentTarget.querySelector('a[data-primary-link]'),
    );
    if (hasPrimaryLink) {
      onNavigation?.(id);
    }
  };

  const aligns = useContext(AlignmentsCtx);

  const cells = Children.map(children, (child, idx) => {
    if (!child) return child;
    return cloneElement(child as ReactElement<any>, {
      alignment: aligns[idx],
    });
  });

  return (
    <tr
      className="cursor-pointer hover:bg-surface-200/40"
      onClick={handleClick}
    >
      {cells}
    </tr>
  );
};

const Cell: FC<CellProps> = ({ children, alignment = 'start' }) => {
  return (
    <td className="border-b border-surface-300 px-4 py-2 md:px-8">
      <div className={alignVariants({ alignment })}>{children}</div>
    </td>
  );
};

export const IndexTable = Object.assign(Root, { Row, Cell });

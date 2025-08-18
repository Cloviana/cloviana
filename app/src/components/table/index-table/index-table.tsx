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
} from 'react';

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

type Heading = {
  title: string;
  alignment?: Alignment;
};

interface RootProps {
  headings: Heading[];
  children?: ReactNode;
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

const AlignmentsCtx = createContext<Alignment[]>([]);

const Root: FC<RootProps> = ({ headings, children }) => {
  const aligns = headings.map((h) => h.alignment ?? 'start');
  return (
    <div className="w-full">
      <table className="w-full">
        <thead className="border-b bg-surface-200/60">
          <tr>
            {headings.map(({ title, alignment }, idx) => (
              <th key={idx} className="px-3 py-2 text-[12px] font-medium">
                <div className={alignVariants({ alignment })}>{title}</div>
              </th>
            ))}
          </tr>
        </thead>
        <AlignmentsCtx.Provider value={aligns}>
          <tbody className="divide-y divide-border">{children}</tbody>
        </AlignmentsCtx.Provider>
      </table>
    </div>
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
    <td className="px-3 py-2">
      <div className={alignVariants({ alignment })}>{children}</div>
    </td>
  );
};

export const IndexTable = Object.assign(Root, { Row, Cell });

'use client';

import { useRouter } from 'next/navigation';
import { FC } from 'react';

import { Anchor } from '@/components/actions';
import { GIcon } from '@/components/icons';
import { Badge } from '@/components/indicators';
import { IndexTable } from '@/components/table/index-table';
import { paths } from '@/config/paths';
import { Blog } from '@/types/api';
import { formatWithDateFns } from '@/utils/format';

interface BlogsTableProps {
  blogs: Blog[];
}

export const BlogsTable: FC<BlogsTableProps> = ({ blogs }) => {
  const { push } = useRouter();

  return (
    <div className="overflow-hidden rounded-md border shadow-sm">
      <IndexTable
        headings={[
          { title: 'Title' },
          { title: 'Keyword' },
          { title: 'Status' },
          { title: 'Updated At' },
          { title: 'Created At', alignment: 'end' },
        ]}
      >
        {blogs.map(
          ({ title, id, keyword, publishStatus, createdAt, updatedAt }) => (
            <IndexTable.Row
              key={id}
              id={id}
              onNavigation={(id) => push(paths.editor.getHref(id))}
            >
              <IndexTable.Cell>
                <Anchor
                  href={paths.editor.getHref(id)}
                  variant={'dark'}
                  dataPrimaryLink
                  className="text-[13px] font-medium no-underline hover:underline"
                >
                  {title}
                </Anchor>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <div className="flex items-center gap-2 text-[13px] text-foreground">
                  <GIcon
                    name="key"
                    size={17}
                    className="-rotate-45 text-foreground-light"
                  />
                  <span>{keyword.phrase}</span>
                </div>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Badge
                  variant={publishStatus === 'DRAFT' ? 'yellow' : 'green'}
                  className="w-min"
                >
                  {publishStatus === 'DRAFT' ? 'Unpublished' : 'Published'}
                </Badge>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <span className="text-[13px]">
                  {formatWithDateFns(updatedAt)}
                </span>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <span className="text-[13px]">
                  {formatWithDateFns(createdAt)}
                </span>
              </IndexTable.Cell>
            </IndexTable.Row>
          ),
        )}
      </IndexTable>
    </div>
  );
};

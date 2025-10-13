'use client';

import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';

import { Anchor } from '@/components/deprecated/actions';
import { GIcon } from '@/components/deprecated/icons';
import { Badge } from '@/components/deprecated/indicators';
import { IndexTable } from '@/components/deprecated/legacy/index-table';
import { paths } from '@/config/paths';
import { Blog } from '@/types/api';
import { formatWithDateFns } from '@/utils/format';

interface BlogsTableProps {
  blogs: Blog[];
}

export const BlogsTable: FC<BlogsTableProps> = ({ blogs }) => {
  const { push } = useRouter();
  const { storeId } = useParams<{ storeId: string }>();

  return (
    <div className="shadow-xs overflow-hidden rounded-md border">
      <IndexTable
        headings={[
          { title: 'Topic' },
          { title: 'Keyword' },
          { title: 'Status' },
          { title: 'Updated At' },
          { title: 'Created At', alignment: 'end' },
        ]}
      >
        {blogs.map(
          ({
            topic,
            id,
            keyword,
            publishStatus,
            createdAt,
            updatedAt,
            generationStep,
          }) => (
            <IndexTable.Row
              key={id}
              id={id}
              onNavigation={(id) =>
                push(
                  generationStep === 'COMPLETE'
                    ? paths.editor.getHref(id)
                    : paths.store.blogs.setup.getHref(storeId, id),
                )
              }
            >
              <IndexTable.Cell>
                <Anchor
                  href={
                    generationStep === 'COMPLETE'
                      ? paths.editor.getHref(id)
                      : paths.store.blogs.setup.getHref(storeId, id)
                  }
                  variant={'dark'}
                  dataPrimaryLink
                  className="text-[13px] font-medium no-underline hover:underline"
                >
                  {topic}
                </Anchor>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <div className="text-foreground flex items-center gap-2 text-[13px]">
                  {keyword ? (
                    <>
                      <GIcon
                        name="key"
                        size={17}
                        className="text-foreground-light -rotate-45"
                      />
                      <span>{keyword.phrase}</span>
                    </>
                  ) : (
                    <span>No keyword set</span>
                  )}
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

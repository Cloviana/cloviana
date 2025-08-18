'use client';

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useMemo, useState } from 'react';

import { SearchIcon } from '@/components/icons';
import { Badge } from '@/components/indicators';
import { TextField } from '@/components/input';
import { Page } from '@/components/legacy';
import { IndexTable } from '@/components/table/index-table';
import { useGetKeywords } from '@/features/keywords/api/get-keywords';
import { KeywordType } from '@/features/keywords/types';

import { AddKeywordButton, KeywordFilter, KeywordInfo } from './_components';
import { ReplaceKeywordButton } from './_components/replace-keyword-button';

const intentColorMap: Record<string, any> = {
  informational: 'blue',
  navigational: 'yellow',
  commercial: 'purple',
  transactional: 'green',
};

const KeywordsPage = () => {
  const { storeId } = useParams();
  const params = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const type: KeywordType = (params.get('type') as KeywordType) ?? 'BLOG';

  const setType = (next: KeywordType) => {
    const sp = new URLSearchParams(params.toString());
    sp.set('type', next);
    replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const { data: keywords = [] } = useGetKeywords(storeId as string, { type });

  const [searchTerm, setSearchTerm] = useState('');
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en', {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    [],
  );

  const filtered = useMemo(
    () =>
      keywords.filter(({ phrase }) =>
        phrase.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [keywords, searchTerm],
  );

  return (
    <Page title="Keywords" fullWidth>
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <KeywordFilter type={type} setType={setType} />
            <KeywordInfo type={type} />
          </div>
          <div className="flex flex-1 items-center justify-between gap-2">
            <div className="min-w-[200px] max-md:flex-1">
              <TextField
                placeholder="Search for a keyword"
                variant="surface"
                size="sm"
                icon={<SearchIcon className="size-2.5 fill-foreground-light" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </div>
            {type === 'BLOG' ? <AddKeywordButton /> : <ReplaceKeywordButton />}
          </div>
        </div>

        <div className="overflow-hidden rounded-md border shadow-sm">
          <IndexTable
            headings={[
              { title: 'Keyword' },
              { title: 'Intent' },
              { title: 'Traffic' },
              { title: 'Difficulty', alignment: 'end' },
            ]}
          >
            {filtered.map(({ id, phrase, difficulty, volume, intent }) => (
              <IndexTable.Row key={id} id={id}>
                <IndexTable.Cell>
                  <span className="text-[13px] font-semibold">{phrase}</span>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Badge
                    variant={intentColorMap[intent.toLowerCase()] ?? 'purple'}
                  >
                    {intent}
                  </Badge>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <span className="text-[13px] font-semibold">
                    {formatter.format(volume)}
                  </span>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <span className="text-[13px] font-semibold">
                    {difficulty}
                  </span>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </div>
      </div>
    </Page>
  );
};

export default KeywordsPage;

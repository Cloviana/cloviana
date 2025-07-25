import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/actions';
import { GIcon } from '@/components/icons';
import { TextField } from '@/components/input';
import { Dialog } from '@/components/overlays/dialog';
import { IndexTable } from '@/components/table/index-table';
import { useAttachKeyword } from '@/features/keywords/api/attach-keyword';
import { useKeywordDetail } from '@/features/keywords/api/get-keyword-detail';
import { Keyword } from '@/types/api';

type FormValues = { keyword: string };

const Skeleton = () => (
  <div className="h-8 w-full animate-pulse rounded-md bg-surface-200" />
);

const EmptyState = () => (
  <div className="flex flex-col items-center gap-2 text-center">
    <GIcon name="snowing" size={24} />
    <h3 className="text-sm font-medium">Search for a keyword</h3>
    <p className="text-sm text-foreground-light">
      Your business keyword is the central focus for optimizing your online
      presence. It serves as the primary term to ensure your business is
      effectively represented and reaches the right audience.
    </p>
  </div>
);

export const ReplaceKeywordButton = () => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState<null | Keyword>(null);
  const { storeId } = useParams<{ storeId: string }>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { keyword: '' },
  });

  const {
    mutateAsync: fetchKeywordDetail,
    isPending: isFetchingDetail,
    error: fetchError,
  } = useKeywordDetail();

  const {
    mutateAsync: attachKeywordMutation,
    isPending: isAttaching,
    error: attachError,
  } = useAttachKeyword({
    mutationConfig: {
      onSuccess: () => setOpen(false),
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async ({ keyword }) => {
    const phrase = keyword.trim();
    if (!phrase) return;
    setKeyword(null);
    const result = await fetchKeywordDetail({ storeId, phrase });
    setKeyword(result);
  };

  const handleAttachKeyword = async () => {
    if (!keyword) return;
    await attachKeywordMutation({
      keywordId: keyword.id,
      type: 'BUSINESS',
      storeId,
    });
  };

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en', {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    [],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          Replace Keyword
        </Button>
      </Dialog.Trigger>
      <Dialog.Overlay />
      <Dialog.Portal>
        <Dialog.Content width="lg">
          <Dialog.Section className="border-b">
            <Dialog.Title>Replace Keyword</Dialog.Title>
          </Dialog.Section>
          <Dialog.Section className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                placeholder="Search for a keyword..."
                helpText="Press enter to analyse the keyword."
                size="md"
                error={errors.keyword?.message}
                icon={<GIcon name="search" />}
                {...register('keyword', { required: 'Keyword is required' })}
              />
            </form>

            {isFetchingDetail ? (
              <Skeleton />
            ) : fetchError ? (
              <p className="text-sm text-red-500">
                Failed to fetch keyword detail
              </p>
            ) : attachError ? (
              <p className="text-sm text-red-500">Failed to attach keyword</p>
            ) : keyword ? (
              <div className="overflow-hidden rounded-md border shadow-sm">
                <IndexTable
                  headings={[
                    { title: 'Keyword' },
                    { title: 'Traffic' },
                    { title: '', alignment: 'end' },
                  ]}
                >
                  <IndexTable.Row id={keyword.id}>
                    <IndexTable.Cell>
                      <span className="text-[13px] font-semibold">
                        {keyword.phrase}
                      </span>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <span className="text-[13px] font-semibold">
                        {formatter.format(keyword.volume)}
                      </span>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAttachKeyword}
                        loading={isAttaching}
                      >
                        Replace
                      </Button>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                </IndexTable>
              </div>
            ) : (
              <EmptyState />
            )}
          </Dialog.Section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};

import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useGetBlog } from '@/api/blogs/get-blog';
import { useUpdateBlog } from '@/api/blogs/update-blog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/ui/page';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGetProductSuggestions } from '@/features/blogs/api/get-product-suggestions';
import { ViewLoading } from '@/features/blogs/components/setup/draft-view/components/view-loading';
import { ViewWrapper } from '@/features/blogs/components/setup/draft-view/components/view-wrapper';
import { useDrafter } from '@/features/blogs/context/drafter';
import { BlogSetupStep } from '@/types/api';
import { cn } from '@/utils/cn';

export const ProductView = () => {
  const { blogId, getNextStepEnum } = useDrafter();
  const { data: blog, isLoading: isBlogLoading } = useGetBlog({ blogId });
  const { mutateAsync: update } = useUpdateBlog();

  const topic = blog?.topic ?? '';
  const title = blog?.title ?? '';

  const { data: suggestions = [], isLoading: isSuggestLoading } =
    useGetProductSuggestions({
      blogId,
      topic,
      title,
    });

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  const productsMap = useMemo(
    () => new Map(suggestions.map((p) => [p.id, p.title])),
    [suggestions],
  );

  useEffect(() => {
    if (!selectedId && suggestions.length) {
      const rec = suggestions.find((s) => s.recommended)?.id;
      setSelectedId(rec || blog?.productId || suggestions[0]?.id || '');
    }
  }, [suggestions, selectedId, blog?.productId]);

  const selectedLabel = selectedId ? productsMap.get(selectedId) : '';

  const disabled = !selectedId || selectedId === (blog?.productId ?? '');

  const nextEnum = getNextStepEnum();

  const save = async () => {
    await update({
      blogId,
      productId: selectedId,
      currentStep: nextEnum as BlogSetupStep,
    });
  };

  if (isBlogLoading || isSuggestLoading) {
    return <ViewLoading />;
  }

  return (
    <ViewWrapper onNext={save} isNextDisabled={disabled}>
      <Page>
        <PageHeader>
          <PageTitle>Product</PageTitle>
          <PageParagraph>
            Select the single best product to feature in this blog post. You can
            search and choose from your store’s products below.
          </PageParagraph>
        </PageHeader>
        <PageContent>
          <div className="grid w-full gap-3">
            <Label htmlFor="product">Product</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  id="product"
                  className="hover:bg-accent/70 flex h-10 w-full cursor-pointer items-center justify-between rounded-md border bg-white px-6 text-sm"
                >
                  <span className="truncate">
                    {selectedLabel || 'Select a product...'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search product..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                      {suggestions.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.title}
                          onSelect={() => {
                            setSelectedId(p.id);
                            setOpen(false);
                          }}
                        >
                          <span className="truncate">{p.title}</span>
                          {p.recommended && (
                            <span className="bg-primary/10 text-primary ml-2 rounded px-2 py-0.5 text-xs">
                              Recommended
                            </span>
                          )}
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              selectedId === p.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </PageContent>
      </Page>
    </ViewWrapper>
  );
};

import { useEffect, useMemo, useState } from 'react';

import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { StepWrapper } from '@/features/blogs/components/drafter/ui/step-wrapper';
import {
  CatalogAutocomplete,
  CatalogSelection,
} from '@/features/catalog/components/catalog-autocomplete';

export const ProductStep = () => {
  const { steps, currentIndex, storeId, blogId, goNext, goPrev } = useDrafter();

  const step = steps[currentIndex];
  const { data: blog } = useGetBlog({ storeId, blogId });

  const [linkedItems, setLinkedItems] = useState<CatalogSelection[]>([]);

  useEffect(() => {
    if (!blog) return;

    const fromProducts: CatalogSelection[] =
      blog.products?.map(({ id, title, imageUrl }) => ({
        id,
        type: 'PRODUCT' as const,
        title,
        imageUrl,
      })) ?? [];

    const fromCollections: CatalogSelection[] =
      blog.collections?.map(({ id, title, imageUrl }) => ({
        id,
        type: 'COLLECTION' as const,
        title,
        imageUrl,
      })) ?? [];

    setLinkedItems([...fromProducts, ...fromCollections]);
  }, [blog]);

  const { mutateAsync: updateBlog, isPending } = useUpdateBlog();

  const productCount = useMemo(
    () => linkedItems.filter((i) => i.type === 'PRODUCT').length,
    [linkedItems],
  );

  const hasValidSelection = productCount >= 1 && productCount <= 3;

  const hasChanges = useMemo(() => {
    if (!blog) return false;

    const currentIds = linkedItems.map((i) => i.id).sort();

    const originalIds = [
      ...(blog.products?.map((p) => p.id) ?? []),
      ...(blog.collections?.map((c) => c.id) ?? []),
    ].sort();

    return JSON.stringify(currentIds) !== JSON.stringify(originalIds);
  }, [blog, linkedItems]);

  const handleNext = async () => {
    if (!hasValidSelection) return;

    if (hasChanges) {
      await updateBlog({
        storeId,
        blogId,
        productIds: linkedItems
          .filter((i) => i.type === 'PRODUCT')
          .map((i) => i.id),
        collectionIds: linkedItems
          .filter((i) => i.type === 'COLLECTION')
          .map((i) => i.id),
        currentStep: steps[currentIndex + 1].dbEnum,
      });
    }
    goNext();
  };

  const handleSelect = (items: CatalogSelection[]) => {
    let productSeen = 0;

    const next: CatalogSelection[] = [];

    for (const item of items) {
      if (item.type === 'PRODUCT') {
        if (productSeen < 3) {
          next.push(item);
          productSeen += 1;
        }
      } else {
        next.push(item);
      }
    }

    setLinkedItems(next);
  };

  return (
    <StepWrapper
      title={step.title}
      description={step.description}
      onNext={handleNext}
      onBack={goPrev}
      isNextDisabled={!hasValidSelection}
      isNextLoading={isPending}
    >
      <CatalogAutocomplete
        storeId={storeId}
        value={linkedItems}
        onSelect={handleSelect}
      />
    </StepWrapper>
  );
};

'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useGetCompetitors } from '@/features/brand-kit/api/competitors';
import { useDeleteBrandKitProduct } from '@/features/brand-kit/api/products';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type { ResearchJob } from '@/features/brand-kit/hooks/use-persisted-research-jobs';
import type { BrandKitProduct } from '@/features/brand-kit/types';
import { DomainAvatarStack } from '@/features/prompts/components/avatar-stack';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';

import { ProductResearchRow } from './product-research-row';

type ProductsTableProps = {
  businessId: string;
  researchJobs: ResearchJob[];
  onResearchFinished: (workflowRunId: string) => void;
};

export function ProductsTable({
  businessId,
  researchJobs,
  onResearchFinished,
}: ProductsTableProps) {
  const { draft, setDraft } = useBrandKitDraft();
  const router = useRouter();
  const deleteProduct = useDeleteBrandKitProduct();
  const confirmDelete = useDeleteConfirmation();
  const competitorsQuery = useGetCompetitors(businessId);
  const competitorsById = new Map(
    (competitorsQuery.data ?? []).map((competitor) => [
      competitor.id,
      competitor,
    ]),
  );
  const isEmpty = draft.products.length === 0 && researchJobs.length === 0;

  async function removeProduct(productId: string) {
    await deleteProduct.mutateAsync({ businessId, productId });
    setDraft((previous) => ({
      ...previous,
      products: previous.products.filter((product) => product.id !== productId),
    }));
  }

  function handleDelete(product: BrandKitProduct) {
    confirmDelete({
      title: 'Delete product?',
      description: `Are you sure you want to delete “${product.name}”? This action cannot be undone.`,
      confirmLabel: 'Delete product',
      onConfirm: () => removeProduct(product.id),
    });
  }

  return (
    <TableFrame variant="bordered">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Name</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-40">Competitors</TableHead>
            <TableHead className="w-14 px-2">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {researchJobs.map((job) => (
            <ProductResearchRow
              key={job.workflowRunId}
              businessId={businessId}
              job={job}
              onFinished={onResearchFinished}
            />
          ))}

          {draft.products.map((product) => {
            const productHref =
              paths.business.brandKit.productLines.detail.getHref(
                businessId,
                product.id,
              );
            const productCompetitors = product.competitorBrandIds.flatMap(
              (competitorId) => {
                const competitor = competitorsById.get(competitorId);
                return competitor
                  ? [{ name: competitor.name, domain: competitor.domain }]
                  : [];
              },
            );

            return (
              <TableRow
                key={product.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => router.push(productHref)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') router.push(productHref);
                }}
              >
                <TableCell className="text-xs font-medium whitespace-normal">
                  {product.name}
                </TableCell>
                <TableCell className="text-xs whitespace-normal">
                  <p className="line-clamp-2">{product.description || '-'}</p>
                </TableCell>
                <TableCell>
                  <DomainAvatarStack items={productCompetitors} />
                </TableCell>
                <TableCell
                  className="w-14 px-2"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${product.name}`}
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {isEmpty && (
        <Empty className="bg-surface min-h-0 rounded-none">
          <EmptyHeader>
            <EmptyTitle className="text-xs">No products yet</EmptyTitle>
            <EmptyDescription className="text-xs">
              Add your first product or service.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </TableFrame>
  );
}

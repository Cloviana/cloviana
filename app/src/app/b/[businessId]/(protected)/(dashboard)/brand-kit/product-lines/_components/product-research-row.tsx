'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import { useGetProductResearch } from '@/features/brand-kit/api/get-product-research';
import { useAddProductCompetitor } from '@/features/brand-kit/api/product-competitors';
import { useCreateBrandKitProduct } from '@/features/brand-kit/api/products';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type { ResearchJob } from '@/features/brand-kit/hooks/use-persisted-research-jobs';
import { competitorKeys } from '@/lib/react-query';
import type { Competitor } from '@/types/api';

const POLL_INTERVAL_MS = 2_000;

type ProductResearchRowProps = {
  businessId: string;
  job: ResearchJob;
  onFinished: (workflowRunId: string) => void;
};

export function ProductResearchRow({
  businessId,
  job,
  onFinished,
}: ProductResearchRowProps) {
  const { setDraft } = useBrandKitDraft();
  const queryClient = useQueryClient();
  const createProduct = useCreateBrandKitProduct();
  const addCompetitor = useAddProductCompetitor();
  const handled = useRef(false);
  const research = useGetProductResearch(businessId, job.workflowRunId, {
    queryConfig: {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === 'SUCCESS' || status === 'FAILED'
          ? false
          : POLL_INTERVAL_MS;
      },
    },
  });

  useEffect(() => {
    if (handled.current || !research.data) return;

    if (research.data.status === 'SUCCESS') {
      handled.current = true;
      if (!research.data.result) {
        toast.error('Cloviana could not finish researching this product');
        onFinished(job.workflowRunId);
        return;
      }

      const result = research.data.result;
      queryClient.setQueryData<Competitor[]>(
        competitorKeys.list(businessId),
        (previous) => {
          const competitorsById = new Map(
            (previous ?? []).map((competitor) => [competitor.id, competitor]),
          );
          for (const competitor of result.competitors) {
            competitorsById.set(competitor.id, competitor);
          }
          return [...competitorsById.values()];
        },
      );

      void (async () => {
        try {
          const { competitorBrandIds, ...product } = result.product;
          let savedProduct = (
            await createProduct.mutateAsync({ businessId, ...product })
          ).item;

          for (const brandId of competitorBrandIds) {
            savedProduct = (
              await addCompetitor.mutateAsync({
                businessId,
                productId: savedProduct.id,
                brandId,
              })
            ).item;
          }

          setDraft((previous) =>
            previous.products.some((item) => item.id === savedProduct.id)
              ? previous
              : {
                  ...previous,
                  products: [...previous.products, savedProduct],
                },
          );
        } catch (error) {
          toast.error(
            getBrandKitError(error, 'Could not save the researched product'),
          );
        } finally {
          onFinished(job.workflowRunId);
        }
      })();
    } else if (research.data.status === 'FAILED') {
      handled.current = true;
      toast.error(
        research.data.error || 'Cloviana could not research this product',
      );
      onFinished(job.workflowRunId);
    }
  }, [
    addCompetitor,
    businessId,
    createProduct,
    job.workflowRunId,
    onFinished,
    queryClient,
    research.data,
    setDraft,
  ]);

  return (
    <TableRow>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex w-fit items-center gap-2 text-xs leading-none font-medium"
              tabIndex={0}
            >
              <Spinner
                variant="1"
                className="text-muted-foreground size-3.5 shrink-0"
              />
              <span>{job.name}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} className="max-w-72">
            Cloviana is researching the product details, positioning, ideal
            customer profile, and competitors.
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
    </TableRow>
  );
}

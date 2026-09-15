'use client';

import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import { useCreateProductResearch } from '@/features/brand-kit/api/create-product-research';
import { useCreateBrandKitProduct } from '@/features/brand-kit/api/products';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { usePersistedResearchJobs } from '@/features/brand-kit/hooks/use-persisted-research-jobs';

import {
  AddProductDialog,
  type ProductFormValues,
} from '../_components/add-product-dialog';
import { ProductsTable } from '../_components/products-table';

type ProductsWidgetProps = {
  businessId: string;
  className?: string;
};

export function ProductsWidget({ businessId, className }: ProductsWidgetProps) {
  const { setDraft } = useBrandKitDraft();
  const createResearch = useCreateProductResearch();
  const createProduct = useCreateBrandKitProduct();
  const [researchJobs, setResearchJobs] = usePersistedResearchJobs(
    businessId,
    'product',
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  async function addProduct({ name, contextUrl }: ProductFormValues) {
    const productId = crypto.randomUUID();

    if (!contextUrl) {
      try {
        const { item } = await createProduct.mutateAsync({
          businessId,
          id: productId,
          name,
        });
        setDraft((previous) => ({
          ...previous,
          products: [...previous.products, item],
        }));
        return true;
      } catch (error) {
        toast.error(getBrandKitError(error, 'Could not add product'));
        return false;
      }
    }

    try {
      const research = await createResearch.mutateAsync({
        businessId,
        requestId: productId,
        name,
        contextUrl,
      });
      const workflowRunId = research.workflowRunId;
      if (!workflowRunId) {
        throw new Error('Product research did not return a workflow run');
      }

      setResearchJobs((previous) =>
        previous.some((job) => job.workflowRunId === workflowRunId)
          ? previous
          : [...previous, { workflowRunId, name }],
      );
      return true;
    } catch (error) {
      toast.error(
        getBrandKitError(error, 'Could not start researching this product'),
      );
      return false;
    }
  }

  const removeResearchJob = useCallback(
    (workflowRunId: string) => {
      setResearchJobs((previous) =>
        previous.filter((job) => job.workflowRunId !== workflowRunId),
      );
    },
    [setResearchJobs],
  );

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Add the products and services you want to research, compare, or
            write about.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus />
              Add Product
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ProductsTable
            businessId={businessId}
            researchJobs={researchJobs}
            onResearchFinished={removeResearchJob}
          />
        </CardContent>
      </Card>

      <AddProductDialog
        open={dialogOpen}
        submitting={createResearch.isPending || createProduct.isPending}
        onOpenChange={setDialogOpen}
        onAdd={addProduct}
      />
    </>
  );
}

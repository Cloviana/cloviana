'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useSaveBrandKitProduct } from '@/features/brand-kit/api/products';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { useAutosave } from '@/features/brand-kit/hooks/use-autosave';

type ProductDetailsWidgetProps = {
  productId: string;
};

export function ProductDetailsWidget({ productId }: ProductDetailsWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const product = draft.products.find((item) => item.id === productId);
  const saveProduct = useSaveBrandKitProduct();

  const saveDescription = useAutosave(
    product?.description ?? '',
    (description) => {
      if (!product) return Promise.resolve();

      return saveProduct.mutateAsync({
        businessId,
        productId,
        name: product.name,
        description: description || null,
        positioning: product.positioning,
        idealCustomer: product.idealCustomer,
        competitorBrandIds: product.competitorBrandIds,
      });
    },
  );
  const savePositioning = useAutosave(
    product?.positioning ?? '',
    (positioning) => {
      if (!product) return Promise.resolve();

      return saveProduct.mutateAsync({
        businessId,
        productId,
        name: product.name,
        description: product.description,
        positioning: positioning || null,
        idealCustomer: product.idealCustomer,
        competitorBrandIds: product.competitorBrandIds,
      });
    },
  );
  const saveIdealCustomer = useAutosave(
    product?.idealCustomer ?? '',
    (idealCustomer) => {
      if (!product) return Promise.resolve();

      return saveProduct.mutateAsync({
        businessId,
        productId,
        name: product.name,
        description: product.description,
        positioning: product.positioning,
        idealCustomer: idealCustomer || null,
        competitorBrandIds: product.competitorBrandIds,
      });
    },
  );

  if (!product) return null;

  return (
    <>
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Describe what the product does, its use cases, key features, and
            related products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="product-details" className="sr-only">
              Product Details
            </FieldLabel>
            <Textarea
              id="product-details"
              rows={6}
              value={product.description ?? ''}
              onBlur={saveDescription}
              onChange={(event) => {
                const description = event.target.value;
                setDraft((previous) => ({
                  ...previous,
                  products: previous.products.map((item) =>
                    item.id === productId ? { ...item, description } : item,
                  ),
                }));
              }}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Positioning and Differentiators</CardTitle>
          <CardDescription>
            Explain how this product differs from alternatives, which strengths
            to emphasize, and the point of view to communicate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="product-positioning" className="sr-only">
              Positioning and Differentiators
            </FieldLabel>
            <Textarea
              id="product-positioning"
              rows={6}
              value={product.positioning ?? ''}
              onBlur={savePositioning}
              onChange={(event) => {
                const positioning = event.target.value;
                setDraft((previous) => ({
                  ...previous,
                  products: previous.products.map((item) =>
                    item.id === productId ? { ...item, positioning } : item,
                  ),
                }));
              }}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Ideal Customer Profile (ICP)</CardTitle>
          <CardDescription>
            Describe the companies and use cases this product fits best. Use
            Audiences to define the people the content addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="product-ideal-customer" className="sr-only">
              Ideal Customer Profile (ICP)
            </FieldLabel>
            <Textarea
              id="product-ideal-customer"
              rows={6}
              value={product.idealCustomer ?? ''}
              onBlur={saveIdealCustomer}
              onChange={(event) => {
                const idealCustomer = event.target.value;
                setDraft((previous) => ({
                  ...previous,
                  products: previous.products.map((item) =>
                    item.id === productId ? { ...item, idealCustomer } : item,
                  ),
                }));
              }}
            />
          </Field>
        </CardContent>
      </Card>
    </>
  );
}

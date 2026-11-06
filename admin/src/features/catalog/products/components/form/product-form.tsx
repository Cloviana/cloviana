'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Controller, FormProvider, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { UnsavedChangesBar } from '@/components/forms/unsaved-changes-bar';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldSetCard,
  FieldSetDescription,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { paths } from '@/config/paths';
import { CategoryPicker } from '@/features/catalog/categories';
import { useFileUploads } from '@/features/files';

import { createProductAction } from '../../actions/create-product';
import { updateProductAction } from '../../actions/update-product';
import { getDraftVariants } from '../../lib/draft-variants';
import type { ProductDetail } from '../../types';

import { DescriptionEditor } from './description-editor';
import { ProductMedia } from './media/product-media';
import { ProductOptions } from './options/product-options';
import type { VariantEdits } from './options/variants-table';
import { SearchEngineListing } from './search-engine-listing';
import { useProductForm, type ProductFormValues } from './use-product-form';

function formValues(
  product?: ProductDetail | null,
): Partial<ProductFormValues> {
  if (!product)
    return {
      title: '',
      description: '',
      handle: '',
      status: 'DRAFT',
      categoryId: null,
      collectionIds: [],
      options: [],
      media: [],
      offers: [],
    };
  return {
    title: product.title,
    description: product.description ?? '',
    handle: product.handle,
    status: product.status,
    categoryId: product.categoryId,
    collectionIds: product.collectionIds,
    options: product.options,
    media: product.media,
    offers: [],
  };
}

function variantValues(product?: ProductDetail | null): VariantEdits {
  return Object.fromEntries(
    (product?.variants ?? []).map((variant) => [
      variant.key,
      {
        ...(variant.customTitle !== null && { title: variant.customTitle }),
        sku: variant.sku ?? '',
      },
    ]),
  );
}

export function ProductForm({
  slug,
  product,
}: {
  slug: string;
  product?: ProductDetail;
}) {
  const formId = useId();
  const router = useRouter();
  const { form } = useProductForm(formValues(product));
  const uploads = useFileUploads(slug);
  const [savedProduct, setSavedProduct] = useState<ProductDetail | null>(
    product ?? null,
  );
  const options = useWatch({ control: form.control, name: 'options' });
  const [variantEdits, setVariantEdits] = useState<VariantEdits>(() =>
    variantValues(product),
  );
  const [pageTitle, setPageTitle] = useState<string | null>(
    product?.seoTitle ?? null,
  );
  const [metaDescription, setMetaDescription] = useState(
    product?.seoDescription ?? '',
  );
  const [resetKey, setResetKey] = useState(0);
  const { isDirty, isSubmitting } = form.formState;
  const savedVariants = variantValues(savedProduct);
  const hasVariantEdits =
    options?.length &&
    getDraftVariants(options).some((variant) => {
      const edit = variantEdits[variant.key];
      const saved = savedVariants[variant.key];
      const currentTitle = edit?.title ?? '';
      const savedTitle = saved?.title ?? '';
      return (
        currentTitle !== savedTitle || (edit?.sku ?? '') !== (saved?.sku ?? '')
      );
    });
  const hasSearchEdits =
    pageTitle !== (savedProduct?.seoTitle ?? null) ||
    metaDescription !== (savedProduct?.seoDescription ?? '');
  const hasUnsavedChanges = Boolean(
    isDirty || hasVariantEdits || hasSearchEdits,
  );

  function discardChanges() {
    uploads.discard();
    form.reset(formValues(savedProduct), { keepFieldsRef: true });
    setVariantEdits(variantValues(savedProduct));
    setPageTitle(savedProduct?.seoTitle ?? null);
    setMetaDescription(savedProduct?.seoDescription ?? '');
    setResetKey((current) => current + 1);
  }

  const submit = form.handleSubmit(
    async (values) => {
      if (savedProduct && !values.handle) {
        form.setError('handle', { message: 'Enter a URL handle.' });
        toast.error('Enter a URL handle in the search engine listing.');
        return;
      }
      try {
        const media = values.media ?? [];
        const files = media.filter(
          (item): item is File => item instanceof File,
        );
        const uploadedAssets = await uploads.waitForUploads(files);
        if (!uploadedAssets) {
          toast.error('Retry or remove failed image uploads before saving.');
          return;
        }
        let fileIndex = 0;
        const updateMedia = media.map((item) =>
          item instanceof File
            ? { assetId: uploadedAssets[fileIndex++].id }
            : 'id' in item
              ? { id: item.id }
              : { assetId: item.assetId },
        );
        const variants = getDraftVariants(values.options).map((variant) => {
          const edit = variantEdits[variant.key];
          return {
            key: variant.key,
            title: edit?.title?.trim() || null,
            sku: edit?.sku?.trim().toUpperCase() || null,
          };
        });
        const common = {
          title: values.title,
          description: values.description ?? '',
          handle: values.handle,
          status: values.status,
          categoryId: values.categoryId ?? null,
          collectionIds: values.collectionIds ?? [],
          options: values.options ?? [],
          seoTitle: pageTitle?.trim() || null,
          seoDescription: metaDescription.trim() || null,
          variants,
        };
        if (savedProduct) {
          const result = await updateProductAction(slug, savedProduct.id, {
            ...common,
            expectedUpdatedAt: savedProduct.updatedAt,
            media: updateMedia,
          });
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          uploads.refresh();
          uploads.forget();
          setSavedProduct(result.product);
          form.reset(formValues(result.product), { keepFieldsRef: true });
          setVariantEdits(variantValues(result.product));
          setPageTitle(result.product.seoTitle);
          setMetaDescription(result.product.seoDescription ?? '');
          setResetKey((current) => current + 1);
          toast.success('Product saved.');
          router.refresh();
        } else {
          const mediaItems = updateMedia.flatMap((item) =>
            'assetId' in item ? [item] : [],
          );
          if (mediaItems.length !== updateMedia.length) {
            toast.error('Could not attach the selected images.');
            return;
          }
          const result = await createProductAction(slug, {
            ...common,
            mediaItems,
            offers: [],
          });
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          uploads.refresh();
          uploads.forget();
          toast.success('Product saved.');
          router.push(paths.mp.products.detail.getHref(slug, result.productId));
        }
      } catch {
        toast.error('Could not save the product. Please try again.');
      }
    },
    () => toast.error('Check the highlighted fields and try again.'),
  );

  return (
    <FormProvider {...form}>
      <form
        id="product-create-form"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={submit}
      >
        <UnsavedChangesBar
          open={hasUnsavedChanges}
          form="product-create-form"
          onDiscard={discardChanges}
          isSaving={isSubmitting}
        />
        <fieldset
          disabled={isSubmitting}
          className="flex min-w-0 flex-col gap-4"
        >
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-8">
            <div className="flex min-w-0 flex-col gap-8">
              <FieldSet aria-label="Product details">
                <FieldSetCard>
                  <FieldGroup key={`product-information-${resetKey}`}>
                    <Controller
                      control={form.control}
                      name="title"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`${formId}-title`} required>
                            Title
                          </FieldLabel>
                          <Input
                            id={`${formId}-title`}
                            required
                            aria-invalid={fieldState.invalid}
                            aria-describedby={
                              fieldState.invalid
                                ? `${formId}-title-error`
                                : undefined
                            }
                            {...field}
                          />
                          <FieldError
                            id={`${formId}-title-error`}
                            errors={[fieldState.error]}
                          />
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="description"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel
                            id={`${formId}-description-label`}
                            htmlFor={`${formId}-description`}
                          >
                            Description
                          </FieldLabel>
                          <DescriptionEditor
                            ref={field.ref}
                            id={`${formId}-description`}
                            aria-labelledby={`${formId}-description-label`}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={
                              fieldState.invalid
                                ? `${formId}-description-error`
                                : undefined
                            }
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                          <FieldError
                            id={`${formId}-description-error`}
                            errors={[fieldState.error]}
                          />
                        </Field>
                      )}
                    />
                    <ProductMedia slug={slug} uploads={uploads} />
                    <Controller
                      control={form.control}
                      name="categoryId"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`${formId}-category`}>
                            Category
                          </FieldLabel>
                          <CategoryPicker
                            slug={slug}
                            ref={field.ref}
                            id={`${formId}-category`}
                            value={field.value ?? null}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={
                              fieldState.invalid
                                ? `${formId}-category-error`
                                : undefined
                            }
                          />
                          <FieldError
                            id={`${formId}-category-error`}
                            errors={[fieldState.error]}
                          />
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </FieldSetCard>
              </FieldSet>
              <FieldSet aria-describedby={`${formId}-variants-description`}>
                <FieldLegend variant="section">Variants</FieldLegend>
                <FieldSetDescription id={`${formId}-variants-description`}>
                  Add options such as size or colour to create different
                  versions of this product. You can set a price and stock for
                  each version a store sells.
                </FieldSetDescription>
                <FieldSetCard>
                  <ProductOptions
                    key={resetKey}
                    edits={variantEdits}
                    setEdits={setVariantEdits}
                  />
                </FieldSetCard>
              </FieldSet>
              <FieldSet>
                <FieldLegend variant="section">
                  Search engine listing
                </FieldLegend>
                <FieldSetCard>
                  <SearchEngineListing
                    pageTitle={pageTitle}
                    setPageTitle={setPageTitle}
                    metaDescription={metaDescription}
                    setMetaDescription={setMetaDescription}
                  />
                </FieldSetCard>
              </FieldSet>
            </div>
            <div className="min-w-0">
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-status`}>Status</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value !== null) field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id={`${formId}-status`}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.invalid
                            ? `${formId}-status-error`
                            : undefined
                        }
                        className="w-full"
                      >
                        <SelectValue>
                          {field.value === 'DRAFT'
                            ? 'Draft'
                            : field.value === 'PUBLISHED'
                              ? 'Active'
                              : field.value === 'UNLISTED'
                                ? 'Unlisted'
                                : field.value === 'PROPOSED'
                                  ? 'Proposed'
                                  : field.value === 'ARCHIVED'
                                    ? 'Archived'
                                    : 'Rejected'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Active</SelectItem>
                          <SelectItem value="UNLISTED">Unlisted</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError
                      id={`${formId}-status-error`}
                      errors={[fieldState.error]}
                    />
                  </Field>
                )}
              />
            </div>
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
}

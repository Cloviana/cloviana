import { z } from 'zod';

import { getDraftVariants, MAX_PRODUCT_VARIANTS } from '../lib/draft-variants';

import { sellerOffersSchema } from './seller-offers.schema';

// Empty optional fields arrive as '' from forms; treat them as omitted.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .transform((value) => value || undefined)
    .optional();

export const PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED', 'UNLISTED'] as const;
export const MAX_PRODUCT_MEDIA = 9;
export const MAX_PRODUCT_IMAGE_SIZE = 50 * 1024 * 1024;

const productOptionSchema = z
  .object({
    persistedId: z.string().uuid().optional(),
    valueIds: z
      .array(z.string().uuid().nullable())
      .max(MAX_PRODUCT_VARIANTS)
      .optional(),
    valueKeys: z.array(z.string().uuid()).max(MAX_PRODUCT_VARIANTS).optional(),
    name: z.string().trim().min(1, 'Option name is required.').max(255),
    values: z
      .array(z.string().trim())
      .min(1, 'Add at least one option value.')
      .max(
        MAX_PRODUCT_VARIANTS,
        `Use ${MAX_PRODUCT_VARIANTS} option values or fewer.`,
      )
      .refine(
        (values) => values.every((value) => value.length > 0),
        'Option values cannot be blank.',
      )
      .refine(
        (values) => values.every((value) => value.length <= 255),
        'Use 255 characters or fewer per value.',
      )
      .refine(
        (values) =>
          new Set(values.map((value) => value.toLowerCase())).size ===
          values.length,
        'Option values must be unique.',
      ),
  })
  .superRefine((option, context) => {
    for (const field of ['valueIds', 'valueKeys'] as const) {
      const ids = option[field];
      if (!ids) continue;
      const retained = ids.filter((id) => id !== null);
      if (
        ids.length !== option.values.length ||
        new Set(retained).size !== retained.length
      ) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: 'Option identities must match the values.',
        });
      }
    }
  });

const createProductFields = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a product title.')
    .max(255, 'Use 255 characters or fewer.'),
  handle: z
    .string()
    .trim()
    .max(120, 'Use 120 characters or fewer.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and hyphens.',
    )
    .or(z.literal(''))
    .transform((value) => value || undefined)
    .optional(),
  status: z.enum(PRODUCT_STATUSES),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  variants: z
    .array(
      z.object({
        key: z.string().min(1),
        title: z.string().max(255).nullable(),
        sku: z
          .string()
          .max(255)
          .transform((value) => value.trim().toUpperCase())
          .nullable(),
      }),
    )
    .max(MAX_PRODUCT_VARIANTS)
    .optional(),
  subtitle: optionalText(255),
  description: optionalText(5000),
  categoryId: z
    .string()
    .uuid('Choose a valid category.')
    .nullish()
    .transform((value) => value ?? undefined),
  collectionIds: z
    .array(z.string().uuid('Choose a valid collection.'))
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Choose each collection once.',
    )
    .optional(),
  options: z
    .array(productOptionSchema)
    .max(MAX_PRODUCT_VARIANTS, `Use ${MAX_PRODUCT_VARIANTS} options or fewer.`)
    .superRefine((options, context) => {
      if (
        options.reduce((count, option) => count * option.values.length, 1) >
        MAX_PRODUCT_VARIANTS
      ) {
        context.addIssue({
          code: 'custom',
          message: `Use options that create ${MAX_PRODUCT_VARIANTS} variants or fewer.`,
        });
      }
      const names = new Set<string>();
      const valueKeys = options.flatMap((option) => option.valueKeys ?? []);
      if (new Set(valueKeys).size !== valueKeys.length) {
        context.addIssue({
          code: 'custom',
          message: 'Option identities must be unique.',
        });
      }
      options.forEach((option, index) => {
        const name = option.name.toLowerCase();
        if (names.has(name)) {
          context.addIssue({
            code: 'custom',
            path: [index, 'name'],
            message: 'Option names must be unique.',
          });
        }
        names.add(name);
      });
    })
    .optional(),
  offers: sellerOffersSchema,
  media: z
    .array(
      z.union([
        z.instanceof(File),
        z.object({
          id: z.string().uuid(),
          assetId: z.string().uuid().optional(),
          url: z.string().url(),
        }),
        z.object({ assetId: z.string().uuid(), url: z.string().url() }),
      ]),
    )
    .max(MAX_PRODUCT_MEDIA, `You can add up to ${MAX_PRODUCT_MEDIA} images.`)
    .refine(
      (files) =>
        files.every(
          (file) => !(file instanceof File) || file.type.startsWith('image/'),
        ),
      'Only image files are supported.',
    )
    .refine(
      (files) =>
        files.every(
          (file) =>
            !(file instanceof File) ||
            (file.size > 0 && file.size <= MAX_PRODUCT_IMAGE_SIZE),
        ),
      'Choose an image of 50 MB or less.',
    )
    .optional(),
});

function validateOfferVariants(
  product: {
    options?: { name: string; values: string[]; valueKeys?: string[] }[];
    offers?: { variantKey: string }[];
  },
  context: z.RefinementCtx,
) {
  const variants = new Set(
    getDraftVariants(product.options).map((variant) => variant.key),
  );
  product.offers?.forEach((offer, index) => {
    if (offer.variantKey && !variants.has(offer.variantKey)) {
      context.addIssue({
        code: 'custom',
        path: ['offers', index, 'variantKey'],
        message: 'This variant changed in Details. Choose a current variant.',
      });
    }
  });
}

export const createProductSchema = createProductFields.superRefine(
  validateOfferVariants,
);
export const productFormSchema = createProductFields
  .extend({
    status: z.enum([
      'DRAFT',
      'PUBLISHED',
      'UNLISTED',
      'PROPOSED',
      'REJECTED',
      'ARCHIVED',
    ]),
  })
  .superRefine(validateOfferVariants);

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormInput = z.infer<typeof productFormSchema>;
export type ProductMediaValue = NonNullable<ProductFormValues['media']>[number];

export const createProductRequestSchema = createProductFields
  .omit({ media: true, offers: true })
  .extend({
    media: z.array(z.never()).max(0).optional(),
    mediaItems: z
      .array(z.object({ assetId: z.string().uuid() }))
      .max(MAX_PRODUCT_MEDIA)
      .optional(),
    offers: z.array(
      z.object({
        sellerId: z.string().uuid(),
        variantKey: z.string().min(1),
        sku: z
          .string()
          .trim()
          .min(1)
          .max(255)
          .transform((value) => value.toUpperCase())
          .optional(),
        price: z
          .string()
          .trim()
          .min(1)
          .max(16)
          .regex(/^\d+(?:\.\d*)?$/),
        initialStock: z.number().int().min(0).max(2_147_483_647),
      }),
    ),
  })
  .superRefine(validateOfferVariants);

export const updateProductRequestSchema = createProductFields
  .omit({ media: true, offers: true })
  .extend({
    expectedUpdatedAt: z.string().datetime(),
    status: z.enum([
      'DRAFT',
      'PUBLISHED',
      'UNLISTED',
      'PROPOSED',
      'REJECTED',
      'ARCHIVED',
    ]),
    handle: z
      .string()
      .trim()
      .min(1, 'Enter a URL handle.')
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers and hyphens.',
      )
      .optional(),
    description: z.string().trim().max(5000),
    categoryId: z.string().uuid().nullable(),
    collectionIds: z
      .array(z.string().uuid())
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Choose each collection once.',
      ),
    options: z.array(productOptionSchema).max(MAX_PRODUCT_VARIANTS),
    media: z
      .array(
        z.union([
          z.object({ id: z.string().uuid() }),
          z.object({ assetId: z.string().uuid() }),
        ]),
      )
      .max(MAX_PRODUCT_MEDIA),
    offers: z
      .array(
        z.object({
          persistedId: z.string().uuid().optional(),
          sellerId: z.string().uuid(),
          variantKey: z.string().min(1),
          price: z
            .string()
            .trim()
            .min(1)
            .max(16)
            .regex(/^\d+(?:\.\d*)?$/),
          quantity: z.number().int().min(0).max(2_147_483_647).optional(),
          inventoryUpdatedAt: z.string().datetime().nullable().optional(),
        }),
      )
      .optional(),
  })
  .superRefine(validateOfferVariants);

export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;

export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;

// What the form fields hold, before the schema trims and transforms them.
export type CreateProductFormValues = z.input<typeof createProductSchema>;

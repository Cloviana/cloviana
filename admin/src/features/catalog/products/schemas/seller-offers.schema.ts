import { z } from 'zod';

export function getCurrencyDecimals(currencyCode: string) {
  try {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currencyCode,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

const sellerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  handle: z.string(),
  logo: z.string().nullable().optional(),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
});

export const sellerOfferSchema = z
  .object({
    id: z.string().uuid(),
    persistedId: z.string().uuid().optional(),
    inventoryUpdatedAt: z.string().datetime().nullable().optional(),
    quantityEditable: z.boolean().optional(),
    rowIndex: z.number().int().nonnegative().optional(),
    seller: sellerSchema.nullable(),
    variantKey: z.string().min(1, 'Choose a variant.'),
    sku: z
      .string()
      .trim()
      .min(1, 'Enter a SKU.')
      .max(255, 'Use 255 characters or fewer.')
      .transform((value) => value.toUpperCase())
      .optional(),
    price: z
      .string()
      .trim()
      .min(1, 'Enter a price.')
      .max(16, 'Enter a smaller price.')
      .regex(/^\d+(?:\.\d*)?$/, 'Enter a valid price of zero or more.'),
    stock: z
      .string()
      .trim()
      .min(1, 'Enter a quantity.')
      .regex(/^\d+$/, 'Quantity must be a whole number of zero or more.')
      .refine(
        (value) =>
          Number.isSafeInteger(Number(value)) && Number(value) <= 2_147_483_647,
        'Enter a smaller quantity.',
      ),
  })
  .superRefine((offer, context) => {
    if (!offer.seller) {
      context.addIssue({
        code: 'custom',
        path: ['seller'],
        message: 'Choose a store.',
      });
      return;
    }
    const decimals = getCurrencyDecimals(offer.seller.currencyCode);
    if ((offer.price.split('.')[1]?.length ?? 0) > decimals) {
      context.addIssue({
        code: 'custom',
        path: ['price'],
        message: `${offer.seller.currencyCode} prices allow ${decimals} decimal places.`,
      });
    }
  });

export const sellerOffersSchema = z
  .array(sellerOfferSchema)
  .superRefine((offers, context) => {
    const combinations = new Map<string, number>();
    offers.forEach((offer, index) => {
      if (!offer.seller || !offer.variantKey) return;
      const key = JSON.stringify([offer.seller.id, offer.variantKey]);
      const previous = combinations.get(key);
      if (previous !== undefined) {
        for (const position of [previous, index]) {
          context.addIssue({
            code: 'custom',
            path: [position, 'variantKey'],
            message: 'This store already has an offer for this variant.',
          });
        }
      }
      combinations.set(key, index);
    });
  });

export type SellerOfferDraft = z.input<typeof sellerOfferSchema>;

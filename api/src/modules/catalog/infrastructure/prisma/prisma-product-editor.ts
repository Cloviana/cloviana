import { randomUUID } from "node:crypto";
import {
  InvalidInputError,
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";

import { Prisma } from "@prisma/client";

import type {
  ProductDetail,
  UpdateProductRecord,
} from "@/modules/catalog/domain/product";
import {
  assertValidVariantAssignments,
  getProductVariants,
  priceInMinorUnits,
} from "@/modules/catalog/domain/product-variants";
import { normalizeSku } from "@/modules/catalog/domain/variant-sku";
import type { PrismaService } from "@/platform/database/prisma/prisma.service";

const identity = (ids: string[]) => JSON.stringify([...ids].sort());
function invalid(message: string): never {
  throw new InvalidInputError(message);
}

function decimalPrice(amount: bigint, currency: string) {
  const decimals =
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  const digits = amount.toString().padStart(decimals + 1, "0");
  return decimals
    ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`
    : digits;
}

export async function loadProductDetail(
  tx: Prisma.TransactionClient,
  marketplaceId: string,
  productId: string,
): Promise<ProductDetail | null> {
  const product = await tx.product.findFirst({
    where: { marketplaceId, id: productId },
    include: {
      _count: { select: { offers: true, reviews: true } },
      categoryLinks: { orderBy: { categoryId: "asc" } },
      collectionLinks: true,
      images: { orderBy: [{ rank: "asc" }, { id: "asc" }] },
      attributes: {
        where: { isVariantAxis: true, isActive: true },
        orderBy: [{ rank: "asc" }, { id: "asc" }],
        include: {
          values: {
            where: { isActive: true },
            orderBy: [{ rank: "asc" }, { id: "asc" }],
          },
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: [{ rank: "asc" }, { id: "asc" }],
        include: { attributeValues: true },
      },
      offers: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          seller: true,
          prices: true,
          inventoryItems: {
            include: {
              inventoryItem: {
                include: { _count: { select: { offerLinks: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!product) {
    return null;
  }
  const options = product.attributes.map((option) => ({
    persistedId: option.id,
    name: option.name,
    values: option.values.map((value) => value.name),
    valueIds: option.values.map((value) => value.id),
    valueKeys: option.values.map((value) => value.id),
  }));
  const generated = getProductVariants(options);
  const variants = product.variants.map((variant) => ({
    id: variant.id,
    key: variant.attributeValues.length
      ? identity(variant.attributeValues.map((value) => value.attributeValueId))
      : "default",
    title: variant.title,
    customTitle: variant.customTitle,
    sku: variant.sku,
  }));
  const currentKeys = new Set(generated.map((variant) => variant.key));
  return {
    id: product.id,
    marketplaceId,
    canDelete: !product._count.offers && !product._count.reviews,
    title: product.title,
    handle: product.handle,
    subtitle: product.subtitle,
    description: product.description,
    status: product.status,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    thumbnail: product.thumbnail,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    categoryId: product.categoryLinks[0]?.categoryId ?? null,
    collectionIds: product.collectionLinks.map((link) => link.collectionId),
    media: product.images.map(({ id, mediaAssetId, url }) => ({
      id,
      assetId: mediaAssetId,
      url,
    })),
    options,
    variants,
    offers: product.offers.map((offer) => {
      const price = offer.prices.find(
        (entry) => entry.currencyCode === offer.seller.currencyCode,
      );
      const links = offer.inventoryItems;
      const single = links.length === 1 ? links[0] : undefined;
      const quantities = links.map((link) =>
        Math.max(
          0,
          Math.floor(
            (link.inventoryItem.stockedQuantity -
              link.inventoryItem.reservedQuantity) /
              Math.max(1, link.requiredQuantity),
          ),
        ),
      );
      const key =
        variants.find((variant) => variant.id === offer.variantId)?.key ?? "";
      return {
        id: offer.id,
        persistedId: offer.id,
        seller: {
          id: offer.seller.id,
          name: offer.seller.name,
          handle: offer.seller.handle,
          logo: offer.seller.logo,
          currencyCode: offer.seller.currencyCode,
        },
        variantKey: currentKeys.has(key) ? key : "",
        price: price ? decimalPrice(price.amount, price.currencyCode) : "",
        stock: String(quantities.length ? Math.min(...quantities) : 0),
        sku: offer.sku,
        inventoryUpdatedAt:
          single?.inventoryItem.updatedAt.toISOString() ?? null,
        quantityEditable: Boolean(
          single &&
            single.requiredQuantity === 1 &&
            single.inventoryItem._count.offerLinks === 1,
        ),
      };
    }),
  };
}

export async function updateProductRecord(
  prisma: PrismaService,
  input: UpdateProductRecord,
): Promise<ProductDetail> {
  const { marketplaceId, productId } = input;
  const generated = getProductVariants(input.options);
  const edits = new Map(
    (input.variants ?? []).map((variant) => [variant.key, variant]),
  );
  assertValidVariantAssignments(generated, input.variants, input.offers);
  try {
    return await prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findFirst({
          where: { marketplaceId, id: productId },
        });
        if (!product) {
          throw new ResourceNotFoundError("Product not found.");
        }
        if (product.updatedAt.toISOString() !== input.expectedUpdatedAt) {
          throw new StateConflictError(
            "This product changed. Close and reopen the editor to load the latest version.",
          );
        }
        if (
          ["PROPOSED", "REJECTED"].includes(input.status) &&
          input.status !== product.status
        ) {
          invalid(
            "Keep the current review status or choose Draft, Active, or Unlisted.",
          );
        }
        if (input.status === "ARCHIVED" && product.status !== "ARCHIVED") {
          invalid("Use the archive action to archive this product.");
        }
        const changed = await tx.product.updateMany({
          where: { marketplaceId, id: productId, updatedAt: product.updatedAt },
          data: {
            title: input.title,
            description: input.description || null,
            status: input.status,
            ...(input.handle !== undefined && { handle: input.handle }),
            ...(input.seoTitle !== undefined && {
              seoTitle: input.seoTitle || null,
            }),
            ...(input.seoDescription !== undefined && {
              seoDescription: input.seoDescription || null,
            }),
            updatedAt: new Date(
              Math.max(Date.now(), product.updatedAt.getTime() + 1),
            ),
          },
        });
        if (changed.count !== 1) {
          throw new StateConflictError(
            "This product changed. Close and reopen the editor to load the latest version.",
          );
        }

        const sellerIds = [
          ...new Set((input.offers ?? []).map((offer) => offer.sellerId)),
        ];
        const sellers = await tx.seller.findMany({
          where: { marketplaceId, id: { in: sellerIds } },
          select: { id: true, currencyCode: true },
        });
        if (sellers.length !== sellerIds.length) {
          invalid("Choose stores from this marketplace.");
        }
        if (
          input.categoryId &&
          !(await tx.productCategory.findFirst({
            where: {
              marketplaceId,
              id: input.categoryId,
              isActive: true,
              isInternal: false,
            },
          }))
        ) {
          invalid("Choose a valid category.");
        }
        if (
          (await tx.productCollection.count({
            where: { marketplaceId, id: { in: input.collectionIds } },
          })) !== new Set(input.collectionIds).size
        ) {
          invalid("Choose collections from this marketplace.");
        }
        if (new Set(input.collectionIds).size !== input.collectionIds.length) {
          invalid("Choose each collection once.");
        }
        await tx.productCategoryLink.deleteMany({
          where: { marketplaceId, productId },
        });
        if (input.categoryId) {
          await tx.productCategoryLink.create({
            data: { marketplaceId, productId, categoryId: input.categoryId },
          });
        }
        await tx.productCollectionLink.deleteMany({
          where: { marketplaceId, productId },
        });
        if (input.collectionIds.length) {
          await tx.productCollectionLink.createMany({
            data: input.collectionIds.map((collectionId) => ({
              marketplaceId,
              productId,
              collectionId,
            })),
          });
        }

        const images = await tx.productImage.findMany({
          where: { marketplaceId, productId },
        });
        const retainedImages = new Set<string>();
        const imageUrls: string[] = [];
        const usedAssets = new Set<string>();
        for (const [rank, media] of input.media.entries()) {
          if ("id" in media) {
            const existing = images.find((image) => image.id === media.id);
            if (!existing || retainedImages.has(media.id)) {
              invalid("Choose each existing image from this product once.");
            }
            if (usedAssets.has(existing.mediaAssetId)) {
              invalid("Choose each image once.");
            }
            usedAssets.add(existing.mediaAssetId);
            retainedImages.add(media.id);
            imageUrls.push(existing.url);
            await tx.productImage.update({
              where: { id: existing.id },
              data: { rank },
            });
          } else {
            const asset = await tx.mediaAsset.findFirst({
              where: { marketplaceId, id: media.assetId, type: "IMAGE" },
              select: { id: true, url: true },
            });
            if (!asset || usedAssets.has(asset.id)) {
              invalid("Choose each image from this marketplace once.");
            }
            usedAssets.add(asset.id);
            imageUrls.push(asset.url);
            await tx.productImage.create({
              data: {
                marketplaceId,
                productId,
                rank,
                url: asset.url,
                mediaAssetId: asset.id,
              },
            });
          }
        }
        const removedImages = images
          .filter((image) => !retainedImages.has(image.id))
          .map((image) => image.id);
        await tx.productImage.deleteMany({
          where: { marketplaceId, productId, id: { in: removedImages } },
        });
        await tx.product.update({
          where: { id: productId },
          data: {
            thumbnail: imageUrls[0] ?? null,
            updatedAt: new Date(
              Math.max(Date.now(), product.updatedAt.getTime() + 1),
            ),
          },
        });

        const attributes = await tx.productAttribute.findMany({
          where: { marketplaceId, productId, isVariantAxis: true },
          include: { values: true },
        });
        const oldVariants = await tx.productVariant.findMany({
          where: { marketplaceId, productId },
          include: { attributeValues: true },
        });
        const activeAttributes: string[] = [];
        const activeValues: string[] = [];
        const resolvedValues: string[][] = [];
        const suppliedAttributes = new Set<string>();
        const suppliedValues = new Set<string>();
        for (const [rank, option] of input.options.entries()) {
          const previous = option.persistedId
            ? attributes.find((entry) => entry.id === option.persistedId)
            : undefined;
          if (
            option.persistedId &&
            (!previous || suppliedAttributes.has(option.persistedId))
          ) {
            invalid("Choose each option from this product once.");
          }
          if (option.persistedId) {
            suppliedAttributes.add(option.persistedId);
          }
          if (
            option.valueIds &&
            option.valueIds.length !== option.values.length
          ) {
            invalid("Option identities must match the values.");
          }
          const attributeId = previous?.id ?? randomUUID();
          if (previous) {
            await tx.productAttribute.update({
              where: { id: attributeId },
              data: { name: option.name, rank, isActive: true },
            });
          } else {
            await tx.productAttribute.create({
              data: {
                id: attributeId,
                marketplaceId,
                productId,
                name: option.name,
                type: "SINGLE_SELECT",
                isVariantAxis: true,
                rank,
              },
            });
          }
          activeAttributes.push(attributeId);
          const values: string[] = [];
          for (const [valueRank, name] of option.values.entries()) {
            const persistedId = option.valueIds?.[valueRank];
            const previousValue = persistedId
              ? previous?.values.find((value) => value.id === persistedId)
              : undefined;
            if (
              persistedId &&
              (!previousValue || suppliedValues.has(persistedId))
            ) {
              invalid("Choose each option value from its own option once.");
            }
            if (persistedId) {
              suppliedValues.add(persistedId);
            }
            const id = previousValue?.id ?? randomUUID();
            if (previousValue) {
              await tx.productAttributeValue.update({
                where: { id },
                data: { name, rank: valueRank, isActive: true },
              });
            } else {
              await tx.productAttributeValue.create({
                data: { id, marketplaceId, attributeId, name, rank: valueRank },
              });
            }
            values.push(id);
            activeValues.push(id);
          }
          resolvedValues.push(values);
        }
        const oldAttributeIds = attributes.map((option) => option.id);
        await tx.productAttribute.updateMany({
          where: {
            marketplaceId,
            productId,
            isVariantAxis: true,
            id: { notIn: activeAttributes },
          },
          data: { isActive: false },
        });
        await tx.productAttributeValue.updateMany({
          where: {
            marketplaceId,
            attributeId: { in: oldAttributeIds },
            id: { notIn: activeValues },
          },
          data: { isActive: false },
        });
        const activeVariantIds: string[] = [];
        const variantsByKey = new Map<string, string>();
        for (const [rank, variant] of generated.entries()) {
          const valueIds = variant.values.map(
            ({ optionIndex, valueIndex }) =>
              resolvedValues[optionIndex][valueIndex],
          );
          const previous = oldVariants.find(
            (entry) =>
              identity(
                entry.attributeValues.map((value) => value.attributeValueId),
              ) === identity(valueIds),
          );
          const id = previous?.id ?? randomUUID();
          const edit = edits.get(variant.key);
          const customTitle = edit
            ? edit.title?.trim() || null
            : (previous?.customTitle ?? null);
          const sku = edit ? normalizeSku(edit.sku) : (previous?.sku ?? null);
          if (previous) {
            await tx.productVariant.update({
              where: { id },
              data: {
                title: customTitle ?? variant.title,
                customTitle,
                sku,
                rank,
                isActive: true,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                id,
                marketplaceId,
                productId,
                title: customTitle ?? variant.title,
                customTitle,
                sku,
                rank,
              },
            });
            if (valueIds.length) {
              await tx.variantAttributeValue.createMany({
                data: valueIds.map((attributeValueId) => ({
                  marketplaceId,
                  variantId: id,
                  attributeValueId,
                })),
              });
            }
          }
          activeVariantIds.push(id);
          variantsByKey.set(variant.key, id);
        }
        await tx.productVariant.updateMany({
          where: { marketplaceId, productId, id: { notIn: activeVariantIds } },
          data: { isActive: false },
        });

        const oldOffers = await tx.offer.findMany({
          where: { marketplaceId, productId, deletedAt: null },
          include: {
            inventoryItems: {
              include: {
                inventoryItem: {
                  include: { _count: { select: { offerLinks: true } } },
                },
              },
            },
          },
        });
        if (
          input.offers === undefined &&
          oldOffers.some((offer) => !activeVariantIds.includes(offer.variantId))
        ) {
          throw new StateConflictError(
            "These options are used by existing seller offers. Update those offers before changing the options.",
          );
        }
        if (input.offers !== undefined) {
          const suppliedOffers = new Set<string>();
          const retainedOffers: string[] = [];
          for (const offer of [...input.offers].sort((a, b) =>
            (a.persistedId ?? a.sellerId).localeCompare(
              b.persistedId ?? b.sellerId,
            ),
          )) {
            const previous = offer.persistedId
              ? oldOffers.find((entry) => entry.id === offer.persistedId)
              : undefined;
            if (
              offer.persistedId &&
              (!previous || suppliedOffers.has(offer.persistedId))
            ) {
              invalid("Choose each seller offer from this product once.");
            }
            if (offer.persistedId) {
              suppliedOffers.add(offer.persistedId);
            }
            // biome-ignore lint/style/noNonNullAssertion: offer variant keys were validated earlier
            const variantId = variantsByKey.get(offer.variantKey)!;
            // biome-ignore lint/style/noNonNullAssertion: sellers were validated against these offers
            const currencyCode = sellers.find(
              (seller) => seller.id === offer.sellerId,
            )?.currencyCode!;
            const amount = priceInMinorUnits(offer.price, currencyCode);
            const retained =
              previous &&
              previous.sellerId === offer.sellerId &&
              previous.variantId === variantId;
            if (retained) {
              retainedOffers.push(previous.id);
              await tx.offerPrice.upsert({
                where: {
                  marketplaceId_offerId_currencyCode: {
                    marketplaceId,
                    offerId: previous.id,
                    currencyCode,
                  },
                },
                create: {
                  marketplaceId,
                  offerId: previous.id,
                  currencyCode,
                  amount,
                },
                update: { amount },
              });
              if (offer.quantity !== undefined) {
                const link =
                  previous.inventoryItems.length === 1
                    ? previous.inventoryItems[0]
                    : undefined;
                if (
                  !link ||
                  link.requiredQuantity !== 1 ||
                  link.inventoryItem._count.offerLinks !== 1
                ) {
                  throw new StateConflictError(
                    "This offer uses shared or combined inventory. Its quantity must be managed through inventory.",
                  );
                }
                const inventory = link.inventoryItem;
                if (
                  offer.inventoryUpdatedAt !== inventory.updatedAt.toISOString()
                ) {
                  throw new StateConflictError(
                    "This stock changed. Close and reopen the editor before changing its quantity.",
                  );
                }
                const stockedQuantity =
                  offer.quantity + inventory.reservedQuantity;
                if (stockedQuantity > 2_147_483_647) {
                  invalid("Enter a smaller quantity.");
                }
                const updated = await tx.inventoryItem.updateMany({
                  where: {
                    id: inventory.id,
                    marketplaceId,
                    sellerId: offer.sellerId,
                    updatedAt: inventory.updatedAt,
                  },
                  data: {
                    stockedQuantity,
                    updatedAt: new Date(
                      Math.max(Date.now(), inventory.updatedAt.getTime() + 1),
                    ),
                  },
                });
                if (updated.count !== 1) {
                  throw new StateConflictError(
                    "This stock changed. Reopen the editor to load the latest quantity.",
                  );
                }
              }
            } else {
              if (offer.quantity === undefined) {
                invalid("Enter a quantity for each new seller offer.");
              }
              const id = randomUUID();
              const inventoryId = randomUUID();
              const sku = `OFFER-${id}`.toUpperCase();
              await tx.offer.create({
                data: {
                  id,
                  marketplaceId,
                  productId,
                  sellerId: offer.sellerId,
                  variantId,
                  sku,
                },
              });
              await tx.offerPrice.create({
                data: { marketplaceId, offerId: id, currencyCode, amount },
              });
              await tx.inventoryItem.create({
                data: {
                  id: inventoryId,
                  marketplaceId,
                  sellerId: offer.sellerId,
                  sku,
                  stockedQuantity: offer.quantity,
                },
              });
              await tx.offerInventoryItem.create({
                data: {
                  marketplaceId,
                  offerId: id,
                  inventoryItemId: inventoryId,
                },
              });
            }
          }
          await tx.offer.updateMany({
            where: {
              marketplaceId,
              productId,
              id: {
                in: oldOffers
                  .filter((offer) => !retainedOffers.includes(offer.id))
                  .map((offer) => offer.id),
              },
            },
            data: { deletedAt: new Date() },
          });
          if (sellerIds.length) {
            await tx.productSeller.createMany({
              data: sellerIds.map((sellerId) => ({
                marketplaceId,
                productId,
                sellerId,
              })),
              skipDuplicates: true,
            });
          }
        }
        // biome-ignore lint/style/noNonNullAssertion: the product exists inside this transaction
        return (await loadProductDetail(tx, marketplaceId, productId))!;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15_000,
      },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new StateConflictError(
        "This product or its stock changed while saving. Reopen the editor and try again.",
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      String(error.meta?.target).includes("handle")
    ) {
      throw new StateConflictError(
        "A product with this handle already exists.",
      );
    }
    throw error;
  }
}

import { randomUUID } from "node:crypto";
import { InvalidInputError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { ProductRepository } from "@/modules/catalog/application/ports/product.repository.port";
import type {
  BulkProductStatus,
  CreateProductRecord,
  Product,
  ProductDetail,
  ProductListQuery,
  ProductPage,
  UpdateProductRecord,
} from "@/modules/catalog/domain/product";
import {
  assertValidVariantAssignments,
  getProductVariants,
  priceInMinorUnits,
} from "@/modules/catalog/domain/product-variants";
import { normalizeSku } from "@/modules/catalog/domain/variant-sku";
import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { translateCatalogPersistenceError } from "./catalog-persistence-errors";
import {
  loadProductDetail,
  updateProductRecord,
} from "./prisma-product-editor";

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async archive(marketplaceId: string, id: string): Promise<boolean> {
    const result = await this.prisma.product.updateMany({
      where: { marketplaceId, id },
      data: { status: "ARCHIVED" },
    });
    return result.count > 0;
  }

  async setStatus(
    marketplaceId: string,
    ids: string[],
    status: BulkProductStatus,
  ): Promise<number> {
    const result = await this.prisma.product.updateMany({
      where: { marketplaceId, id: { in: ids }, status: { not: status } },
      data: { status },
    });
    return result.count;
  }

  // Products with offers or reviews are skipped; the caller reports how many were left.
  async deleteMany(marketplaceId: string, ids: string[]): Promise<number> {
    const result = await this.prisma.product.deleteMany({
      where: {
        marketplaceId,
        id: { in: ids },
        offers: { none: {} },
        reviews: { none: {} },
      },
    });
    return result.count;
  }

  async delete(
    marketplaceId: string,
    id: string,
  ): Promise<"deleted" | "not_found" | "not_deletable"> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { marketplaceId, id },
        select: { _count: { select: { offers: true, reviews: true } } },
      });
      if (!product) {
        return "not_found";
      }
      if (product._count.offers || product._count.reviews) {
        return "not_deletable";
      }
      await tx.product.delete({
        where: { marketplaceId_id: { marketplaceId, id } },
      });
      return "deleted";
    });
  }

  async unarchive(
    marketplaceId: string,
    id: string,
  ): Promise<"updated" | "not_found" | "not_archived"> {
    const result = await this.prisma.product.updateMany({
      where: { marketplaceId, id, status: "ARCHIVED" },
      data: { status: "DRAFT" },
    });
    if (result.count) {
      return "updated";
    }
    const product = await this.prisma.product.findFirst({
      where: { marketplaceId, id },
      select: { id: true },
    });
    return product ? "not_archived" : "not_found";
  }

  create(input: CreateProductRecord): Promise<Product> {
    const {
      marketplaceId,
      options = [],
      offers,
      images,
      collectionIds = [],
      categoryId,
    } = input;
    const variants = getProductVariants(options).map((variant) => ({
      ...variant,
      id: randomUUID(),
    }));
    const variantsByKey = new Map(
      variants.map((variant) => [variant.key, variant]),
    );
    const edits = new Map(
      (input.variants ?? []).map((variant) => [variant.key, variant]),
    );
    assertValidVariantAssignments(variants, input.variants, offers);
    const sellerIds = [...new Set(offers.map((offer) => offer.sellerId))];

    return this.prisma
      .$transaction(
        async (tx) => {
          const sellers = await tx.seller.findMany({
            where: { marketplaceId, id: { in: sellerIds } },
            select: { id: true, currencyCode: true },
          });
          if (sellers.length !== sellerIds.length) {
            throw new InvalidInputError(
              "Choose sellers from this marketplace.",
            );
          }
          if (
            collectionIds.length > 0 &&
            (await tx.productCollection.count({
              where: { marketplaceId, id: { in: collectionIds } },
            })) !== collectionIds.length
          ) {
            throw new InvalidInputError(
              "Choose collections from this marketplace.",
            );
          }
          if (
            categoryId &&
            !(await tx.productCategory.findFirst({
              where: {
                marketplaceId,
                id: categoryId,
                isActive: true,
                isInternal: false,
              },
              select: { id: true },
            }))
          ) {
            throw new InvalidInputError("Choose a valid category.");
          }
          const currencies = new Map(
            sellers.map((seller) => [
              seller.id,
              seller.currencyCode.toUpperCase(),
            ]),
          );
          const offerRecords = offers.map((offer) => {
            // biome-ignore lint/style/noNonNullAssertion: sellers were validated against these offers
            const currencyCode = currencies.get(offer.sellerId)!;
            const id = randomUUID();
            return {
              ...offer,
              id,
              sku: normalizeSku(offer.sku) ?? `OFFER-${id}`.toUpperCase(),
              inventoryId: randomUUID(),
              // biome-ignore lint/style/noNonNullAssertion: offer variant keys were validated earlier
              variantId: variantsByKey.get(offer.variantKey)!.id,
              currencyCode,
              amount: priceInMinorUnits(offer.price, currencyCode),
            };
          });
          const resolvedImages = [] as { id: string; url: string }[];
          const seenAssets = new Set<string>();
          for (const image of images) {
            const asset = await tx.mediaAsset.findFirst({
              where: { marketplaceId, id: image.assetId, type: "IMAGE" },
              select: { id: true, url: true },
            });
            if (!asset || seenAssets.has(asset.id)) {
              throw new InvalidInputError(
                "Choose each image from this marketplace once.",
              );
            }
            seenAssets.add(asset.id);
            resolvedImages.push(asset);
          }
          const product = await tx.product.create({
            data: {
              marketplaceId,
              title: input.title,
              handle: input.handle,
              subtitle: input.subtitle,
              description: input.description,
              seoTitle: input.seoTitle ?? null,
              seoDescription: input.seoDescription ?? null,
              status: input.status,
              thumbnail: resolvedImages[0]?.url ?? null,
            },
          });
          const productId = product.id;
          if (categoryId) {
            await tx.productCategoryLink.create({
              data: { marketplaceId, productId, categoryId },
            });
          }
          if (collectionIds.length > 0) {
            await tx.productCollectionLink.createMany({
              data: collectionIds.map((collectionId) => ({
                marketplaceId,
                productId,
                collectionId,
              })),
            });
          }
          if (resolvedImages.length > 0) {
            await tx.productImage.createMany({
              data: resolvedImages.map((asset, rank) => ({
                marketplaceId,
                productId,
                mediaAssetId: asset.id,
                url: asset.url,
                rank,
              })),
            });
          }
          const attributes = options.map((option, rank) => ({
            id: randomUUID(),
            marketplaceId,
            productId,
            name: option.name,
            type: "SINGLE_SELECT" as const,
            isVariantAxis: true,
            rank,
          }));
          const attributeValues = options.map((option, optionIndex) =>
            option.values.map((name, rank) => ({
              id: randomUUID(),
              marketplaceId,
              attributeId: attributes[optionIndex].id,
              name,
              rank,
            })),
          );
          if (attributes.length > 0) {
            await tx.productAttribute.createMany({ data: attributes });
            await tx.productAttributeValue.createMany({
              data: attributeValues.flat(),
            });
          }
          await tx.productVariant.createMany({
            data: variants.map(({ id, title, key }, rank) => {
              const edit = edits.get(key);
              const customTitle = edit?.title?.trim() || null;
              return {
                id,
                marketplaceId,
                productId,
                title: customTitle ?? title,
                customTitle,
                sku: normalizeSku(edit?.sku),
                rank,
              };
            }),
          });
          const variantValues = variants.flatMap((variant) =>
            variant.values.map(({ optionIndex, valueIndex }) => ({
              marketplaceId,
              variantId: variant.id,
              attributeValueId: attributeValues[optionIndex][valueIndex].id,
            })),
          );
          if (variantValues.length > 0) {
            await tx.variantAttributeValue.createMany({ data: variantValues });
          }
          if (offerRecords.length === 0) {
            return product;
          }

          await tx.productSeller.createMany({
            data: sellerIds.map((sellerId) => ({
              marketplaceId,
              productId,
              sellerId,
            })),
          });
          await tx.offer.createMany({
            data: offerRecords.map(({ id, sellerId, variantId, sku }) => ({
              id,
              marketplaceId,
              productId,
              sellerId,
              variantId,
              sku,
            })),
          });
          await tx.offerPrice.createMany({
            data: offerRecords.map(({ id, currencyCode, amount }) => ({
              marketplaceId,
              offerId: id,
              currencyCode,
              amount,
            })),
          });
          await tx.inventoryItem.createMany({
            data: offerRecords.map(
              ({ inventoryId, sellerId, initialStock, sku }) => ({
                id: inventoryId,
                marketplaceId,
                sellerId,
                sku,
                stockedQuantity: initialStock,
              }),
            ),
          });
          await tx.offerInventoryItem.createMany({
            data: offerRecords.map(({ id, inventoryId }) => ({
              marketplaceId,
              offerId: id,
              inventoryItemId: inventoryId,
            })),
          });
          return product;
        },
        { timeout: 15_000 },
      )
      .catch(translateCatalogPersistenceError);
  }

  async findByMarketplace(
    marketplaceId: string,
    query: ProductListQuery,
  ): Promise<ProductPage> {
    const {
      page,
      pageSize,
      q,
      status,
      offers,
      category,
      updatedFrom,
      updatedTo,
      createdFrom,
      createdTo,
    } = query;
    const range = (from?: string, to?: string) =>
      from || to
        ? {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          }
        : undefined;

    const and: Prisma.ProductWhereInput[] = [];
    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { handle: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (status?.length) {
      and.push({ status: { in: status } });
    }
    if (offers) {
      and.push({
        offers:
          offers === "has"
            ? { some: { deletedAt: null } }
            : { none: { deletedAt: null } },
      });
    }
    if (category?.length) {
      const ids = category.filter((id) => id !== "none");
      and.push({
        OR: [
          ...(ids.length
            ? [{ categoryLinks: { some: { categoryId: { in: ids } } } }]
            : []),
          ...(category.includes("none")
            ? [{ categoryLinks: { none: {} } }]
            : []),
        ],
      });
    }
    const updatedAt = range(updatedFrom, updatedTo);
    if (updatedAt) {
      and.push({ updatedAt });
    }
    const createdAt = range(createdFrom, createdTo);
    if (createdAt) {
      and.push({ createdAt });
    }
    const where: Prisma.ProductWhereInput = { marketplaceId, AND: and };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        // The id breaks ties, so a product never appears on two pages.
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          categoryLinks: {
            select: { category: { select: { id: true, name: true } } },
            orderBy: { categoryId: "asc" },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    const offerCounts = new Map(
      (
        await this.prisma.offer.groupBy({
          by: ["productId"],
          where: {
            marketplaceId,
            deletedAt: null,
            productId: { in: products.map(({ id }) => id) },
          },
          _count: { _all: true },
        })
      ).map(({ productId, _count }) => [productId, _count._all]),
    );
    return {
      total,
      items: products.map(({ categoryLinks, ...product }) => ({
        ...product,
        category: categoryLinks[0]?.category ?? null,
        offerCount: offerCounts.get(product.id) ?? 0,
      })),
    };
  }

  update(input: UpdateProductRecord): Promise<ProductDetail> {
    return updateProductRecord(this.prisma, input).catch(
      translateCatalogPersistenceError,
    );
  }

  findById(marketplaceId: string, id: string): Promise<ProductDetail | null> {
    return this.prisma.$transaction(
      (tx) => loadProductDetail(tx, marketplaceId, id),
      { isolationLevel: "RepeatableRead" },
    );
  }
}

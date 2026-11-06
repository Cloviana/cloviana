import { Module } from "@nestjs/common";

import { MarketplacesModule } from "@/modules/marketplaces/marketplaces.module";

import { ArchiveProductUseCase } from "./application/archive-product/archive-product.use-case";
import { CreateCategoryUseCase } from "./application/create-category/create-category.use-case";
import { CreateProductUseCase } from "./application/create-product/create-product.use-case";
import { DeleteCategoryUseCase } from "./application/delete-category/delete-category.use-case";
import { DeleteProductUseCase } from "./application/delete-product/delete-product.use-case";
import { DeleteProductsUseCase } from "./application/delete-products/delete-products.use-case";
import { GetCategoryImpactUseCase } from "./application/get-category-impact/get-category-impact.use-case";
import { GetCategoryUseCase } from "./application/get-category/get-category.use-case";
import { GetCollectionUseCase } from "./application/get-collection/get-collection.use-case";
import { GetProductUseCase } from "./application/get-product/get-product.use-case";
import { ListAttributesUseCase } from "./application/list-attributes/list-attributes.use-case";
import { ListCategoriesUseCase } from "./application/list-categories/list-categories.use-case";
import { ListCollectionsUseCase } from "./application/list-collections/list-collections.use-case";
import { ListProductsUseCase } from "./application/list-products/list-products.use-case";
import { ATTRIBUTE_REPOSITORY } from "./application/ports/attribute.repository.port";
import { CategoryCache } from "./application/ports/category-cache.port";
import { CATEGORY_REPOSITORY } from "./application/ports/category.repository.port";
import { COLLECTION_REPOSITORY } from "./application/ports/collection.repository.port";
import { PRODUCT_REPOSITORY } from "./application/ports/product.repository.port";
import { SetProductsStatusUseCase } from "./application/set-products-status/set-products-status.use-case";
import { UnarchiveProductUseCase } from "./application/unarchive-product/unarchive-product.use-case";
import { UpdateCategoryUseCase } from "./application/update-category/update-category.use-case";
import { UpdateProductUseCase } from "./application/update-product/update-product.use-case";
import { CategoryCacheAdapter } from "./infrastructure/cache/category-cache.adapter";
import { PrismaAttributeRepository } from "./infrastructure/prisma/prisma-attribute.repository";
import { PrismaCategoryRepository } from "./infrastructure/prisma/prisma-category.repository";
import { PrismaCollectionRepository } from "./infrastructure/prisma/prisma-collection.repository";
import { PrismaProductRepository } from "./infrastructure/prisma/prisma-product.repository";
import { AttributesController } from "./presentation/http/attributes.controller";
import { CategoriesController } from "./presentation/http/categories.controller";
import { CollectionsController } from "./presentation/http/collections.controller";
import { ProductsController } from "./presentation/http/products.controller";

@Module({
  imports: [MarketplacesModule],
  controllers: [
    ProductsController,
    CategoriesController,
    CollectionsController,
    AttributesController,
  ],
  providers: [
    ArchiveProductUseCase,
    UnarchiveProductUseCase,
    DeleteProductUseCase,
    DeleteProductsUseCase,
    SetProductsStatusUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    ListProductsUseCase,
    GetProductUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    GetCategoryImpactUseCase,
    ListCollectionsUseCase,
    GetCollectionUseCase,
    ListAttributesUseCase,
    { provide: CategoryCache, useClass: CategoryCacheAdapter },
    { provide: ATTRIBUTE_REPOSITORY, useClass: PrismaAttributeRepository },
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
    { provide: COLLECTION_REPOSITORY, useClass: PrismaCollectionRepository },
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  ],
  // Read capabilities shared with the marketplace assistant.
  exports: [ListProductsUseCase, GetProductUseCase],
})
export class CatalogModule {}

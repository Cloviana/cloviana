import {
  InvalidInputError,
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { CategoryRepository } from "@/modules/catalog/application/ports/category.repository.port";
import type {
  Category,
  CategoryImpact,
  CategoryListInput,
  CategoryPage,
  CategoryPathEntry,
  CreateCategoryRecord,
  UpdateCategoryRecord,
} from "@/modules/catalog/domain/category";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

import { translateCatalogPersistenceError } from "./catalog-persistence-errors";

const visibleCategory = { isActive: true, isInternal: false };

// Hidden (inactive or internal) categories are for the dashboard; the storefront and product picker skip them.
const visibility = (includeHidden: boolean) =>
  includeHidden ? {} : visibleCategory;

function categorySelect(includeHidden: boolean) {
  return {
    id: true,
    name: true,
    handle: true,
    parentId: true,
    isActive: true,
    isInternal: true,
    description: true,
    updatedAt: true,
    _count: {
      select: {
        children: { where: visibility(includeHidden) },
        productLinks: true,
      },
    },
  } satisfies Prisma.ProductCategorySelect;
}

type CategoryRow = Prisma.ProductCategoryGetPayload<{
  select: ReturnType<typeof categorySelect>;
}>;
type PathNode = CategoryPathEntry & { parentId: string | null };
type CategoryDb = Pick<Prisma.TransactionClient, "productCategory">;

// A guard against a corrupted tree, far deeper than any real one.
const MAX_DEPTH = 64;
const STALE = "This category changed. Reload to load the latest version.";

/** The category and its descendants, one array per level: the category first, its children next, and so on. */
async function subtreeLevels(
  db: CategoryDb,
  marketplaceId: string,
  rootId: string,
): Promise<string[][]> {
  const levels = [[rootId]];
  const seen = new Set(levels[0]);
  while (levels.length < MAX_DEPTH) {
    const children = await db.productCategory.findMany({
      where: { marketplaceId, parentId: { in: levels[levels.length - 1] } },
      select: { id: true },
    });
    const next = children
      .map((child) => child.id)
      .filter((id) => !seen.has(id));
    if (next.length === 0) {
      break;
    }
    for (const id of next) {
      seen.add(id);
    }
    levels.push(next);
  }
  return levels;
}

/** Walks up from the new parent: reaching the category itself means it would move under its own descendant. */
async function assertCanMoveUnder(
  db: CategoryDb,
  marketplaceId: string,
  id: string,
  newParentId: string,
): Promise<void> {
  const seen = new Set<string>();
  let cursor: string | null = newParentId;
  while (cursor && !seen.has(cursor)) {
    if (cursor === id) {
      throw new InvalidInputError(
        "A category can't be moved under itself or one of its subcategories.",
      );
    }
    seen.add(cursor);
    const node: { parentId: string | null } | null =
      await db.productCategory.findFirst({
        where: { marketplaceId, id: cursor },
        select: { parentId: true },
      });
    if (!node) {
      throw new InvalidInputError("Parent category not found.");
    }
    cursor = node.parentId;
  }
}

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    marketplaceId: string,
    input: CategoryListInput,
  ): Promise<CategoryPage> {
    const includeHidden = input.includeHidden ?? false;
    const rows = await this.prisma.productCategory.findMany({
      where: {
        marketplaceId,
        ...visibility(includeHidden),
        ...(input.search
          ? { name: { contains: input.search, mode: "insensitive" as const } }
          : { parentId: input.parentId ?? null }),
      },
      select: categorySelect(includeHidden),
      orderBy: [{ rank: "asc" }, { name: "asc" }, { id: "asc" }],
      skip: input.offset,
      take: input.limit + 1,
    });
    const hasMore = rows.length > input.limit;
    return {
      items: await this.withPaths(
        marketplaceId,
        rows.slice(0, input.limit),
        includeHidden,
      ),
      nextOffset: hasMore ? input.offset + input.limit : null,
    };
  }

  async findById(
    marketplaceId: string,
    id: string,
    { includeHidden = false }: { includeHidden?: boolean } = {},
  ): Promise<Category | null> {
    const row = await this.prisma.productCategory.findFirst({
      where: { marketplaceId, id, ...visibility(includeHidden) },
      select: categorySelect(includeHidden),
    });
    if (!row) {
      return null;
    }
    return (
      (await this.withPaths(marketplaceId, [row], includeHidden))[0] ?? null
    );
  }

  async create(input: CreateCategoryRecord): Promise<Category> {
    const { marketplaceId, parentId = null } = input;
    const row = await this.prisma
      .$transaction(async (tx) => {
        // New categories go after their siblings. Two creations at once can share a rank; the name then breaks the tie.
        const siblings = await tx.productCategory.aggregate({
          where: { marketplaceId, parentId },
          _max: { rank: true },
        });
        return tx.productCategory.create({
          data: {
            marketplaceId,
            parentId,
            name: input.name,
            handle: input.handle,
            description: input.description,
            isActive: input.isActive,
            isInternal: input.isInternal,
            rank: (siblings._max.rank ?? -1) + 1,
          },
          select: categorySelect(true),
        });
      })
      .catch(translateCatalogPersistenceError);
    const [category] = await this.withPaths(marketplaceId, [row], true);
    if (!category) {
      throw new Error("The created category could not be loaded");
    }
    return category;
  }

  async update(input: UpdateCategoryRecord): Promise<Category> {
    const { marketplaceId, id, parentId } = input;
    await this.prisma
      .$transaction(async (tx) => {
        const current = await tx.productCategory.findFirst({
          where: { marketplaceId, id },
          select: { parentId: true, updatedAt: true },
        });
        if (!current) {
          throw new ResourceNotFoundError("Category not found");
        }
        if (current.updatedAt.toISOString() !== input.expectedUpdatedAt) {
          throw new StateConflictError(STALE);
        }

        const moved = parentId !== current.parentId;
        if (moved && parentId) {
          await assertCanMoveUnder(tx, marketplaceId, id, parentId);
        }
        // A moved category goes after its new siblings.
        const siblings = moved
          ? await tx.productCategory.aggregate({
              where: { marketplaceId, parentId },
              _max: { rank: true },
            })
          : null;

        const changed = await tx.productCategory.updateMany({
          where: { marketplaceId, id, updatedAt: current.updatedAt },
          data: {
            name: input.name,
            handle: input.handle,
            description: input.description,
            isActive: input.isActive,
            isInternal: input.isInternal,
            parentId,
            ...(siblings && { rank: (siblings._max.rank ?? -1) + 1 }),
          },
        });
        if (changed.count !== 1) {
          throw new StateConflictError(STALE);
        }
      })
      .catch(translateCatalogPersistenceError);

    const category = await this.findById(marketplaceId, id, {
      includeHidden: true,
    });
    if (!category) {
      throw new ResourceNotFoundError("Category not found");
    }
    return category;
  }

  async getImpact(
    marketplaceId: string,
    id: string,
  ): Promise<CategoryImpact | null> {
    const category = await this.prisma.productCategory.findFirst({
      where: { marketplaceId, id },
      select: { id: true },
    });
    if (!category) {
      return null;
    }

    const ids = (await subtreeLevels(this.prisma, marketplaceId, id)).flat();
    const products = await this.prisma.productCategoryLink.groupBy({
      by: ["productId"],
      where: { marketplaceId, categoryId: { in: ids } },
    });
    return { subcategories: ids.length - 1, products: products.length };
  }

  async deleteTree(
    marketplaceId: string,
    id: string,
  ): Promise<string[] | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const category = await tx.productCategory.findFirst({
          where: { marketplaceId, id },
          select: { id: true },
        });
        if (!category) {
          return null;
        }

        const levels = await subtreeLevels(tx, marketplaceId, id);
        // Deepest level first: a category can't be deleted while it still has children.
        for (const level of [...levels].reverse()) {
          await tx.productCategory.deleteMany({
            where: { marketplaceId, id: { in: level } },
          });
        }
        return levels.flat();
      });
    } catch (error) {
      // A subcategory was added after the branch was read.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new StateConflictError("A subcategory was added. Try again.");
      }
      throw error;
    }
  }

  private async withPaths(
    marketplaceId: string,
    rows: CategoryRow[],
    includeHidden: boolean,
  ): Promise<Category[]> {
    const nodes = new Map<string, PathNode>(rows.map((row) => [row.id, row]));
    const requested = new Set(nodes.keys());
    let parents = rows.flatMap((row) => (row.parentId ? [row.parentId] : []));

    // One lookup per ancestor level, shared across every result in the page.
    while (parents.length > 0) {
      const ids = [...new Set(parents)].filter((id) => !requested.has(id));
      if (ids.length === 0) {
        break;
      }
      for (const id of ids) {
        requested.add(id);
      }
      const ancestors = await this.prisma.productCategory.findMany({
        where: { marketplaceId, id: { in: ids }, ...visibility(includeHidden) },
        select: { id: true, name: true, parentId: true },
      });
      for (const ancestor of ancestors) {
        nodes.set(ancestor.id, ancestor);
      }
      parents = ancestors.flatMap((node) =>
        node.parentId ? [node.parentId] : [],
      );
    }

    return rows.flatMap((row) => {
      const path: CategoryPathEntry[] = [];
      const visited = new Set<string>();
      let node: PathNode | undefined = row;
      while (node) {
        if (visited.has(node.id)) {
          return [];
        }
        visited.add(node.id);
        path.unshift({ id: node.id, name: node.name });
        if (node.parentId === null) {
          break;
        }
        node = nodes.get(node.parentId);
        // Hide descendants of inactive/internal categories as well.
        if (!node) {
          return [];
        }
      }
      return [
        {
          id: row.id,
          name: row.name,
          handle: row.handle,
          parentId: row.parentId,
          path,
          hasChildren: row._count.children > 0,
          isActive: row.isActive,
          isInternal: row.isInternal,
          description: row.description,
          updatedAt: row.updatedAt,
          productCount: row._count.productLinks,
        },
      ];
    });
  }
}

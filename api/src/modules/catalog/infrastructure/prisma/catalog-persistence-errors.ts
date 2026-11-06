import { Prisma } from "@prisma/client";
import {
  CatalogHandleConflictError,
  VariantSkuConflictError,
} from "../../domain/catalog.errors";

/** Translate only the known uniqueness constraints; let unrelated failures propagate. */
export function translateCatalogPersistenceError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const details = JSON.stringify(error.meta ?? {}).toLowerCase();
    if (String(error.meta?.target).includes("handle")) {
      throw new CatalogHandleConflictError();
    }
    if (
      details.includes("sku") &&
      !details.includes("sellerid") &&
      !details.includes("offers")
    ) {
      throw new VariantSkuConflictError();
    }
  }
  throw error;
}

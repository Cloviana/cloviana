import { createHash } from "node:crypto";
import { InvalidInputError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { FileRepository } from "@/modules/files/application/ports/file.repository.port";
import type { FilePage, ListFilesInput } from "@/modules/files/domain/file";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

const cursorSchema = z.object({
  filter: z.string(),
  id: z.string().uuid(),
  value: z.union([z.string(), z.number(), z.null()]),
});

@Injectable()
export class PrismaFileRepository implements FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListFilesInput): Promise<FilePage> {
    const {
      marketplaceId,
      query,
      type,
      minSize,
      maxSize,
      productId,
      sort,
      limit,
      cursor,
    } = input;
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify([
          marketplaceId,
          query ?? null,
          type ?? null,
          minSize ?? null,
          maxSize ?? null,
          productId ?? null,
          sort,
          limit,
        ]),
      )
      .digest("hex");
    const field =
      sort === "newest" || sort === "oldest"
        ? "createdAt"
        : sort.startsWith("name_")
          ? "sortName"
          : "size";
    const direction =
      sort === "newest" || sort.endsWith("_desc") ? "desc" : "asc";
    const where: Prisma.MediaAssetWhereInput = {
      marketplaceId,
      ...(query && { filename: { contains: query, mode: "insensitive" } }),
      ...(type && { type }),
      ...((minSize !== undefined || maxSize !== undefined) && {
        size: {
          ...(minSize !== undefined && { gte: minSize }),
          ...(maxSize !== undefined && { lte: maxSize }),
        },
      }),
      ...(productId && {
        productImages: { some: { marketplaceId, productId } },
      }),
    };
    if (cursor) {
      let decoded: z.infer<typeof cursorSchema>;
      try {
        decoded = cursorSchema.parse(
          JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
        );
      } catch {
        throw new InvalidInputError("Invalid media cursor.");
      }
      if (
        decoded.filter !== fingerprint ||
        (field === "createdAt" &&
          (typeof decoded.value !== "string" ||
            !Number.isFinite(Date.parse(decoded.value)))) ||
        (field === "sortName" &&
          decoded.value !== null &&
          typeof decoded.value !== "string") ||
        (field === "size" &&
          decoded.value !== null &&
          (typeof decoded.value !== "number" ||
            !Number.isInteger(decoded.value) ||
            decoded.value < 0))
      ) {
        throw new InvalidInputError("Invalid media cursor.");
      }
      const value =
        field === "createdAt"
          ? new Date(decoded.value as string)
          : decoded.value;
      if (value === null) {
        where.AND = [{ [field]: null }, { id: { gt: decoded.id } }];
      } else {
        const comparison = direction === "asc" ? { gt: value } : { lt: value };
        const branches: Prisma.MediaAssetWhereInput[] = [
          { [field]: comparison },
          { [field]: value, id: { gt: decoded.id } },
        ];
        if (field !== "createdAt") {
          branches.push({ [field]: null });
        }
        where.AND = [{ OR: branches }];
      }
    }
    const orderBy: Prisma.MediaAssetOrderByWithRelationInput[] = [
      field === "createdAt"
        ? { createdAt: direction }
        : field === "sortName"
          ? { sortName: { sort: direction, nulls: "last" } }
          : { size: { sort: direction, nulls: "last" } },
      { id: "asc" },
    ];
    const rows = await this.prisma.mediaAsset.findMany({
      where,
      orderBy,
      take: limit + 1,
      select: {
        id: true,
        url: true,
        filename: true,
        sortName: true,
        type: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });
    const items = rows.slice(0, limit);
    const last = items[items.length - 1];
    const nextCursor =
      rows.length > limit && last
        ? Buffer.from(
            JSON.stringify({
              filter: fingerprint,
              id: last.id,
              value:
                field === "createdAt"
                  ? last.createdAt.toISOString()
                  : last[field],
            }),
          ).toString("base64url")
        : null;
    return {
      items: items.map(({ sortName: _sortName, ...item }) => item),
      nextCursor,
    };
  }
}

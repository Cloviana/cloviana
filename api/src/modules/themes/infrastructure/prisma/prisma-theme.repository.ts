import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { ThemeRepository } from "@/modules/themes/application/ports/theme.repository.port";
import type {
  CreateThemeFromTemplateRecord,
  CreateThemeFromTemplateResult,
  Theme,
} from "@/modules/themes/domain/theme";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

const themeSelect = {
  id: true,
  name: true,
  status: true,
  thumbnailId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ThemeSelect;

type ThemeRow = Prisma.ThemeGetPayload<{ select: typeof themeSelect }>;

const toTheme = (row: ThemeRow, liveThemeId: string | null): Theme => ({
  ...row,
  isLive: row.id === liveThemeId,
});

@Injectable()
export class PrismaThemeRepository implements ThemeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // The live theme is the one behind the deployment the storefront publication points at.
  private async liveThemeId(marketplaceId: string): Promise<string | null> {
    const publication = await this.prisma.storefrontPublication.findUnique({
      where: { marketplaceId },
      select: { liveDeployment: { select: { themeId: true } } },
    });
    return publication?.liveDeployment?.themeId ?? null;
  }

  async findAll(marketplaceId: string): Promise<Theme[]> {
    const [rows, liveThemeId] = await Promise.all([
      this.prisma.theme.findMany({
        where: { marketplaceId, status: "ACTIVE" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: themeSelect,
      }),
      this.liveThemeId(marketplaceId),
    ]);
    return rows.map((row) => toTheme(row, liveThemeId));
  }

  async rename(
    marketplaceId: string,
    themeId: string,
    name: string,
  ): Promise<Theme | null> {
    // updateMany keeps the update scoped to this marketplace's active themes.
    const { count } = await this.prisma.theme.updateMany({
      where: { id: themeId, marketplaceId, status: "ACTIVE" },
      data: { name },
    });
    if (count === 0) {
      return null;
    }
    const [row, liveThemeId] = await Promise.all([
      this.prisma.theme.findUniqueOrThrow({
        where: { id: themeId },
        select: themeSelect,
      }),
      this.liveThemeId(marketplaceId),
    ]);
    return toTheme(row, liveThemeId);
  }

  createFromTemplate(
    input: CreateThemeFromTemplateRecord,
  ): Promise<CreateThemeFromTemplateResult> {
    // Platform-owner write: runs as the privileged role, so RLS does not apply here.
    return this.prisma.$transaction(async (tx) => {
      // Serialises concurrent creates for this marketplace so the limit check below cannot race.
      const [{ ownerId }] = await tx.$queryRaw<{ ownerId: string }[]>`
        SELECT "ownerId" FROM marketplaces WHERE id = ${input.marketplaceId}::uuid FOR UPDATE`;

      const active = await tx.theme.count({
        where: { marketplaceId: input.marketplaceId, status: "ACTIVE" },
      });
      if (active >= input.maxThemes) {
        return { limitReached: true } as const;
      }

      await tx.theme.create({
        data: {
          id: input.id,
          marketplaceId: input.marketplaceId,
          name: input.name,
          templateKey: input.templateKey,
          templateVersion: input.templateVersion,
          storageKey: input.storageKey,
          snapshotVersion: 1,
          lastSnapshotAt: new Date(),
          provisioningStatus: "READY",
        },
      });
      const revision = await tx.themeRevision.create({
        data: {
          marketplaceId: input.marketplaceId,
          themeId: input.id,
          commitSha: input.commitSha,
          storageKey: input.storageKey,
          origin: "SYSTEM",
          message: "Initial template",
        },
      });
      const row = await tx.theme.update({
        where: { id: input.id },
        data: { headRevisionId: revision.id },
        select: themeSelect,
      });

      // The marketplace's first theme is published right away. The deployment stays queued until
      // the deploy pipeline builds it; the publication already points the storefront at it.
      const deployment = await tx.themeDeployment.create({
        data: {
          marketplaceId: input.marketplaceId,
          themeId: input.id,
          revisionId: revision.id,
          requestedBy: ownerId,
          status: "QUEUED",
        },
      });
      await tx.storefrontPublication.upsert({
        where: { marketplaceId: input.marketplaceId },
        create: {
          marketplaceId: input.marketplaceId,
          liveDeploymentId: deployment.id,
        },
        update: { liveDeploymentId: deployment.id },
      });
      return { theme: toTheme(row, input.id) };
    });
  }
}

import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BrandKind, Prisma } from "@prisma/client";

const TRANSACTION_MAX_WAIT_MS = 30_000;
const TRANSACTION_TIMEOUT_MS = 120_000;

const brandKitInclude = {
  brands: {
    where: { kind: BrandKind.BUSINESS },
    select: { name: true, domain: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
  products: { include: { competitorLinks: true } },
  contentTypes: true,
  audiences: true,
  regions: true,
  variables: true,
  rules: true,
  samples: {
    include: {
      audienceLinks: { select: { audienceId: true } },
      regionLinks: { select: { regionId: true } },
    },
  },
  publishedVersion: {
    select: {
      id: true,
      number: true,
      sourceRevision: true,
      publishedAt: true,
    },
  },
} satisfies Prisma.BrandKitInclude;

type BrandKitWithRelations = Prisma.BrandKitGetPayload<{
  include: typeof brandKitInclude;
}>;

function toAggregate(brandKit: BrandKitWithRelations) {
  const { brands, variables, products, samples, ...rest } = brandKit;
  const brand = brands[0];
  if (!brand) {
    throw new Error(`Brand kit ${brandKit.id} is missing its BUSINESS brand`);
  }

  return {
    ...rest,
    brand,
    products: products.map(({ competitorLinks, ...product }) => ({
      ...product,
      competitorBrandIds: competitorLinks.map((link) => link.competitorBrandId),
    })),
    samples: samples.map(({ audienceLinks, regionLinks, ...sample }) => ({
      ...sample,
      audienceIds: audienceLinks.map((link) => link.audienceId),
      regionIds: regionLinks.map((link) => link.regionId),
    })),
    customVariables: variables,
  };
}

function toPublishedSnapshot(
  brandKit: BrandKitWithRelations,
  competitors: Array<{
    id: string;
    name: string;
    domain: string;
    aliases: string[];
  }>,
) {
  const draft = toAggregate(brandKit);

  return {
    brand: draft.brand,
    about: draft.about,
    voice: draft.voice,
    writerPersona: draft.writerPersona,
    products: draft.products.map(
      ({
        id,
        name,
        description,
        positioning,
        idealCustomer,
        competitorBrandIds,
      }) => ({
        id,
        name,
        description,
        positioning,
        idealCustomer,
        competitorBrandIds,
      }),
    ),
    competitors,
    contentTypes: draft.contentTypes.map(({ id, name, ctaText, ctaUrl }) => ({
      id,
      name,
      ctaText,
      ctaUrl,
    })),
    audiences: draft.audiences.map(({ id, name, description }) => ({
      id,
      name,
      description,
    })),
    regions: draft.regions.map(({ id, name, description }) => ({
      id,
      name,
      description,
    })),
    customVariables: draft.customVariables.map(({ id, name, key, value }) => ({
      id,
      name,
      key,
      value,
    })),
    rules: draft.rules.map(
      ({
        id,
        scope,
        content,
        position,
        audienceId,
        regionId,
        contentTypeId,
      }) => ({
        id,
        scope,
        content,
        position,
        audienceId,
        regionId,
        contentTypeId,
      }),
    ),
    samples: draft.samples.map(
      ({
        id,
        contentTypeId,
        audienceIds,
        regionIds,
        kind,
        value,
        content,
      }) => ({
        id,
        contentTypeId,
        audienceIds,
        regionIds,
        kind,
        value,
        content,
      }),
    ),
  };
}

type PublishedSnapshot = ReturnType<typeof toPublishedSnapshot>;

@Injectable()
export class BrandKitService {
  constructor(private readonly prisma: PrismaService) {}

  async getBrandKit(businessId: string) {
    const brandKit = await this.prisma.brandKit.findUniqueOrThrow({
      where: { businessId },
      include: brandKitInclude,
    });

    return toAggregate(brandKit);
  }

  async getVersions(businessId: string) {
    const brandKitId = await this.findBrandKitId(businessId);
    if (!brandKitId) {
      return [];
    }

    return this.prisma.brandKitVersion.findMany({
      where: { brandKitId },
      select: {
        id: true,
        number: true,
        sourceRevision: true,
        publishedAt: true,
      },
      orderBy: { number: "desc" },
    });
  }

  async publish(businessId: string) {
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const brandKit = await transaction.brandKit.findUniqueOrThrow({
            where: { businessId },
            include: brandKitInclude,
          });

          if (
            brandKit.publishedVersion?.sourceRevision === brandKit.draftRevision
          ) {
            return brandKit.publishedVersion;
          }

          const [competitors, latestVersion] = await Promise.all([
            transaction.brand.findMany({
              where: {
                brandKitId: brandKit.id,
                kind: BrandKind.COMPETITOR,
              },
              select: {
                id: true,
                name: true,
                domain: true,
                aliases: true,
              },
              orderBy: [{ name: "asc" }, { createdAt: "asc" }],
            }),
            transaction.brandKitVersion.findFirst({
              where: { brandKitId: brandKit.id },
              orderBy: { number: "desc" },
              select: { number: true },
            }),
          ]);
          const version = await transaction.brandKitVersion.create({
            data: {
              brandKitId: brandKit.id,
              number: (latestVersion?.number ?? 0) + 1,
              sourceRevision: brandKit.draftRevision,
              snapshot: toPublishedSnapshot(
                brandKit,
                competitors,
              ) as unknown as Prisma.InputJsonValue,
            },
            select: {
              id: true,
              number: true,
              sourceRevision: true,
              publishedAt: true,
            },
          });

          await transaction.brandKit.update({
            where: { id: brandKit.id },
            data: { publishedVersionId: version.id },
          });

          return version;
        },
        { maxWait: TRANSACTION_MAX_WAIT_MS, timeout: TRANSACTION_TIMEOUT_MS },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Brand kit was published concurrently");
      }
      throw error;
    }
  }

  async discard(businessId: string) {
    await this.prisma.$transaction(
      async (transaction) => {
        const brandKit = await transaction.brandKit.findUniqueOrThrow({
          where: { businessId },
          select: {
            id: true,
            publishedVersion: {
              select: { snapshot: true, sourceRevision: true },
            },
          },
        });
        if (!brandKit.publishedVersion) {
          throw new BadRequestException("Brand kit has not been published yet");
        }
        const snapshot = brandKit.publishedVersion
          .snapshot as unknown as PublishedSnapshot;
        const brandKitId = brandKit.id;

        const businessBrand = await transaction.brand.findFirstOrThrow({
          where: { brandKitId, kind: BrandKind.BUSINESS },
          select: { id: true },
        });
        await transaction.brand.update({
          where: { id: businessBrand.id },
          data: { name: snapshot.brand.name, domain: snapshot.brand.domain },
        });

        await transaction.brand.deleteMany({
          where: {
            brandKitId,
            kind: BrandKind.COMPETITOR,
            id: { notIn: snapshot.competitors.map((c) => c.id) },
          },
        });
        for (const competitor of snapshot.competitors) {
          await transaction.brand.upsert({
            where: { id: competitor.id },
            update: {
              name: competitor.name,
              domain: competitor.domain,
              aliases: competitor.aliases,
            },
            create: {
              id: competitor.id,
              brandKitId,
              kind: BrandKind.COMPETITOR,
              name: competitor.name,
              domain: competitor.domain,
              aliases: competitor.aliases,
            },
          });
        }

        await transaction.contentType.deleteMany({
          where: {
            brandKitId,
            id: { notIn: snapshot.contentTypes.map((c) => c.id) },
          },
        });
        for (const contentType of snapshot.contentTypes) {
          await transaction.contentType.upsert({
            where: { id: contentType.id },
            update: {
              name: contentType.name,
              ctaText: contentType.ctaText,
              ctaUrl: contentType.ctaUrl,
            },
            create: {
              id: contentType.id,
              brandKitId,
              name: contentType.name,
              ctaText: contentType.ctaText,
              ctaUrl: contentType.ctaUrl,
            },
          });
        }

        await transaction.audience.deleteMany({
          where: {
            brandKitId,
            id: { notIn: snapshot.audiences.map((a) => a.id) },
          },
        });
        for (const audience of snapshot.audiences) {
          await transaction.audience.upsert({
            where: { id: audience.id },
            update: { name: audience.name, description: audience.description },
            create: { ...audience, brandKitId },
          });
        }

        await transaction.region.deleteMany({
          where: {
            brandKitId,
            id: { notIn: snapshot.regions.map((r) => r.id) },
          },
        });
        for (const region of snapshot.regions) {
          await transaction.region.upsert({
            where: { id: region.id },
            update: { name: region.name, description: region.description },
            create: { ...region, brandKitId },
          });
        }

        await transaction.customVariable.deleteMany({
          where: {
            brandKitId,
            id: { notIn: snapshot.customVariables.map((v) => v.id) },
          },
        });
        for (const variable of snapshot.customVariables) {
          await transaction.customVariable.upsert({
            where: { id: variable.id },
            update: {
              name: variable.name,
              key: variable.key,
              value: variable.value,
            },
            create: { ...variable, brandKitId },
          });
        }

        await transaction.product.deleteMany({
          where: {
            brandKitId,
            id: { notIn: snapshot.products.map((p) => p.id) },
          },
        });
        for (const product of snapshot.products) {
          const { competitorBrandIds, ...fields } = product;
          await transaction.product.upsert({
            where: { id: product.id },
            update: fields,
            create: { ...fields, brandKitId },
          });
          await transaction.productCompetitor.deleteMany({
            where: { productId: product.id },
          });
          if (competitorBrandIds.length > 0) {
            await transaction.productCompetitor.createMany({
              data: competitorBrandIds.map((competitorBrandId) => ({
                productId: product.id,
                competitorBrandId,
              })),
            });
          }
        }

        // ponytail: swapping two rules'/audiences'/etc. names or scopes
        // between publishes could transiently collide on a unique constraint
        // here since Postgres checks constraints per-statement, not
        // deferred. Rare enough (and safely surfaced as a 500, not silent
        // corruption) that a two-phase rename-safe upsert isn't worth it.
        await transaction.rule.deleteMany({
          where: { brandKitId, id: { notIn: snapshot.rules.map((r) => r.id) } },
        });
        for (const rule of snapshot.rules) {
          await transaction.rule.upsert({
            where: { id: rule.id },
            update: {
              scope: rule.scope,
              content: rule.content,
              position: rule.position,
              audienceId: rule.audienceId,
              regionId: rule.regionId,
              contentTypeId: rule.contentTypeId,
            },
            create: { ...rule, brandKitId },
          });
        }

        await transaction.sample.deleteMany({
          where: {
            brandKitId,
            id: { notIn: snapshot.samples.map((s) => s.id) },
          },
        });
        for (const sample of snapshot.samples) {
          const { audienceIds, regionIds, ...fields } = sample;
          await transaction.sample.upsert({
            where: { id: sample.id },
            update: {
              kind: fields.kind,
              value: fields.value,
              content: fields.content,
              contentTypeId: fields.contentTypeId,
            },
            create: { ...fields, brandKitId },
          });
          await Promise.all([
            transaction.sampleAudience.deleteMany({
              where: { sampleId: sample.id },
            }),
            transaction.sampleRegion.deleteMany({
              where: { sampleId: sample.id },
            }),
          ]);
          await Promise.all([
            audienceIds.length > 0
              ? transaction.sampleAudience.createMany({
                  data: audienceIds.map((audienceId) => ({
                    sampleId: sample.id,
                    audienceId,
                    brandKitId,
                  })),
                })
              : undefined,
            regionIds.length > 0
              ? transaction.sampleRegion.createMany({
                  data: regionIds.map((regionId) => ({
                    sampleId: sample.id,
                    regionId,
                    brandKitId,
                  })),
                })
              : undefined,
          ]);
        }

        await transaction.brandKit.update({
          where: { id: brandKitId },
          data: {
            about: snapshot.about,
            voice: snapshot.voice,
            writerPersona: snapshot.writerPersona,
            draftRevision: brandKit.publishedVersion.sourceRevision,
          },
        });
      },
      { maxWait: TRANSACTION_MAX_WAIT_MS, timeout: TRANSACTION_TIMEOUT_MS },
    );

    return this.getBrandKit(businessId);
  }

  async getVersion(businessId: string, versionId: string) {
    const brandKitId = await this.findBrandKitId(businessId);
    if (!brandKitId) {
      throw new NotFoundException("Brand kit version not found");
    }

    return this.prisma.brandKitVersion.findFirstOrThrow({
      where: { id: versionId, brandKitId },
    });
  }

  private async findBrandKitId(businessId: string): Promise<string | null> {
    const brandKit = await this.prisma.brandKit.findUnique({
      where: { businessId },
      select: { id: true },
    });

    return brandKit?.id ?? null;
  }
}

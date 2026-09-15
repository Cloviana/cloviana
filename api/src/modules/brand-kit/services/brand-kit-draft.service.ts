import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BrandKind, Prisma, RuleScope } from "@prisma/client";
import type {
  CreateAudienceDto,
  CreateCompetitorDto,
  CreateContentTypeDto,
  CreateCustomVariableDto,
  CreateProductDto,
  CreateRegionDto,
  CreateRuleDto,
  CreateSampleDto,
  UpdateAudienceDto,
  UpdateCompetitorDto,
  UpdateContentTypeDto,
  UpdateCustomVariableDto,
  UpdateProductDto,
  UpdateProfileDto,
  UpdateRegionDto,
  UpdateRuleDto,
  UpdateSampleDto,
  UpdateVoiceDto,
  UpdateWriterPersonaDto,
} from "../dto/brand-kit-draft.dto";

const TRANSACTION_MAX_WAIT_MS = 5_000;
const TRANSACTION_TIMEOUT_MS = 10_000;

type DraftTransaction = Prisma.TransactionClient;

type ScopedDraftItem = {
  scope: RuleScope;
  audienceId?: string | null;
  regionId?: string | null;
  contentTypeId?: string | null;
};

function toProduct<
  T extends { competitorLinks: { competitorBrandId: string }[] },
>(product: T) {
  const { competitorLinks, ...fields } = product;

  return {
    ...fields,
    competitorBrandIds: competitorLinks.map((link) => link.competitorBrandId),
  };
}

function toSample<
  T extends {
    audienceLinks: { audienceId: string }[];
    regionLinks: { regionId: string }[];
  },
>(sample: T) {
  const { audienceLinks, regionLinks, ...fields } = sample;

  return {
    ...fields,
    audienceIds: audienceLinks.map((link) => link.audienceId),
    regionIds: regionLinks.map((link) => link.regionId),
  };
}

function validateScopeTarget(item: ScopedDraftItem, label: string) {
  const audienceId = item.audienceId ?? null;
  const regionId = item.regionId ?? null;
  const contentTypeId = item.contentTypeId ?? null;
  const isValid =
    (item.scope === RuleScope.GLOBAL &&
      !audienceId &&
      !regionId &&
      !contentTypeId) ||
    (item.scope === RuleScope.AUDIENCE &&
      Boolean(audienceId) &&
      !regionId &&
      !contentTypeId) ||
    (item.scope === RuleScope.REGION &&
      !audienceId &&
      Boolean(regionId) &&
      !contentTypeId) ||
    (item.scope === RuleScope.CONTENT_TYPE &&
      !audienceId &&
      !regionId &&
      Boolean(contentTypeId));

  if (!isValid) {
    throw new BadRequestException(`${label} scope does not match its target`);
  }
}

@Injectable()
export class BrandKitDraftService {
  constructor(private readonly prisma: PrismaService) {}

  updateProfile(businessId: string, dto: UpdateProfileDto) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const currentBrand = await transaction.brand.findFirstOrThrow({
        where: { brandKitId, kind: BrandKind.BUSINESS },
        select: { id: true },
      });
      const brand = await transaction.brand.update({
        where: { id: currentBrand.id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
        },
        select: { name: true, domain: true },
      });
      const brandKit = await transaction.brandKit.update({
        where: { id: brandKitId },
        data: {
          ...(dto.about !== undefined ? { about: dto.about } : {}),
        },
        select: { about: true },
      });

      return { brand, about: brandKit.about };
    });
  }

  updateVoice(businessId: string, dto: UpdateVoiceDto) {
    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.brandKit.update({
        where: { id: brandKitId },
        data: { ...(dto.voice !== undefined ? { voice: dto.voice } : {}) },
        select: { voice: true },
      }),
    );
  }

  updateWriterPersona(businessId: string, dto: UpdateWriterPersonaDto) {
    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.brandKit.update({
        where: { id: brandKitId },
        data: {
          ...(dto.writerPersona !== undefined
            ? { writerPersona: dto.writerPersona }
            : {}),
        },
        select: { writerPersona: true },
      }),
    );
  }

  createProduct(businessId: string, dto: CreateProductDto) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const product = await transaction.product.create({
        data: { ...dto, brandKitId },
        include: { competitorLinks: true },
      });

      return toProduct(product);
    });
  }

  updateProduct(businessId: string, productId: string, dto: UpdateProductDto) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const product = await transaction.product.findFirstOrThrow({
        where: { id: productId, brandKitId },
        select: { id: true },
      });
      const updated = await transaction.product.update({
        where: { id: product.id },
        data: dto,
        include: { competitorLinks: true },
      });

      return toProduct(updated);
    });
  }

  deleteProduct(businessId: string, productId: string) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const links = await transaction.productCompetitor.findMany({
        where: { productId },
        select: { competitorBrandId: true },
      });
      const result = await transaction.product.deleteMany({
        where: { id: productId, brandKitId },
      });
      if (result.count === 0) {
        throw new NotFoundException("Product not found");
      }
      for (const link of links) {
        await this.deleteOrphanedCompetitor(
          transaction,
          link.competitorBrandId,
        );
      }

      return { id: productId };
    });
  }

  addProductCompetitor(
    businessId: string,
    productId: string,
    competitorBrandId: string,
  ) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      await Promise.all([
        transaction.product.findFirstOrThrow({
          where: { id: productId, brandKitId },
          select: { id: true },
        }),
        transaction.brand.findFirstOrThrow({
          where: {
            id: competitorBrandId,
            brandKitId,
            kind: BrandKind.COMPETITOR,
          },
          select: { id: true },
        }),
      ]);
      await transaction.productCompetitor.create({
        data: { productId, competitorBrandId },
      });
      const product = await transaction.product.findUniqueOrThrow({
        where: { id: productId },
        include: { competitorLinks: true },
      });

      return toProduct(product);
    });
  }

  removeProductCompetitor(
    businessId: string,
    productId: string,
    competitorBrandId: string,
  ) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      await transaction.product.findFirstOrThrow({
        where: { id: productId, brandKitId },
        select: { id: true },
      });
      const deleted = await transaction.productCompetitor.deleteMany({
        where: { productId, competitorBrandId },
      });
      if (deleted.count === 0) {
        throw new NotFoundException("Product competitor not found");
      }
      await this.deleteOrphanedCompetitor(transaction, competitorBrandId);
      const product = await transaction.product.findUniqueOrThrow({
        where: { id: productId },
        include: { competitorLinks: true },
      });

      return toProduct(product);
    });
  }

  // ponytail: a competitor Brand only exists as a product's competitive
  // context; once no product references it, it isn't tracking a real
  // competitor anymore, so it's deleted rather than left as an invisible
  // orphan the UI can't reach.
  private async deleteOrphanedCompetitor(
    transaction: DraftTransaction,
    competitorBrandId: string,
  ) {
    const remaining = await transaction.productCompetitor.count({
      where: { competitorBrandId },
    });
    if (remaining === 0) {
      await transaction.brand.deleteMany({
        where: { id: competitorBrandId, kind: BrandKind.COMPETITOR },
      });
    }
  }

  async getCompetitors(businessId: string) {
    const brandKit = await this.prisma.brandKit.findUniqueOrThrow({
      where: { businessId },
      select: { id: true },
    });

    return this.prisma.brand.findMany({
      where: { brandKitId: brandKit.id, kind: BrandKind.COMPETITOR },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    });
  }

  createCompetitor(businessId: string, dto: CreateCompetitorDto) {
    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.brand.create({
        data: {
          ...dto,
          aliases: dto.aliases ?? [dto.name],
          brandKitId,
          kind: BrandKind.COMPETITOR,
        },
      }),
    );
  }

  updateCompetitor(
    businessId: string,
    brandId: string,
    dto: UpdateCompetitorDto,
  ) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const competitor = await transaction.brand.findFirstOrThrow({
        where: { id: brandId, brandKitId, kind: BrandKind.COMPETITOR },
        select: { id: true },
      });

      return transaction.brand.update({
        where: { id: competitor.id },
        data: dto,
      });
    });
  }

  deleteCompetitor(businessId: string, brandId: string) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const result = await transaction.brand.deleteMany({
        where: { id: brandId, brandKitId, kind: BrandKind.COMPETITOR },
      });
      if (result.count === 0) {
        throw new NotFoundException("Competitor not found");
      }

      return { id: brandId };
    });
  }

  createContentType(businessId: string, dto: CreateContentTypeDto) {
    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.contentType.create({ data: { ...dto, brandKitId } }),
    );
  }

  updateContentType(
    businessId: string,
    contentTypeId: string,
    dto: UpdateContentTypeDto,
  ) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const contentType = await transaction.contentType.findFirstOrThrow({
        where: { id: contentTypeId, brandKitId },
        select: { id: true },
      });

      return transaction.contentType.update({
        where: { id: contentType.id },
        data: dto,
      });
    });
  }

  deleteContentType(businessId: string, contentTypeId: string) {
    return this.deleteScopedItem(
      businessId,
      contentTypeId,
      "Content type",
      (transaction, brandKitId) =>
        transaction.contentType.deleteMany({
          where: { id: contentTypeId, brandKitId },
        }),
    );
  }

  createAudience(businessId: string, dto: CreateAudienceDto) {
    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.audience.create({ data: { ...dto, brandKitId } }),
    );
  }

  updateAudience(
    businessId: string,
    audienceId: string,
    dto: UpdateAudienceDto,
  ) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const audience = await transaction.audience.findFirstOrThrow({
        where: { id: audienceId, brandKitId },
        select: { id: true },
      });

      return transaction.audience.update({
        where: { id: audience.id },
        data: dto,
      });
    });
  }

  deleteAudience(businessId: string, audienceId: string) {
    return this.deleteScopedItem(
      businessId,
      audienceId,
      "Audience",
      (transaction, brandKitId) =>
        transaction.audience.deleteMany({
          where: { id: audienceId, brandKitId },
        }),
    );
  }

  createRegion(businessId: string, dto: CreateRegionDto) {
    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.region.create({ data: { ...dto, brandKitId } }),
    );
  }

  updateRegion(businessId: string, regionId: string, dto: UpdateRegionDto) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const region = await transaction.region.findFirstOrThrow({
        where: { id: regionId, brandKitId },
        select: { id: true },
      });

      return transaction.region.update({
        where: { id: region.id },
        data: dto,
      });
    });
  }

  deleteRegion(businessId: string, regionId: string) {
    return this.deleteScopedItem(
      businessId,
      regionId,
      "Region",
      (transaction, brandKitId) =>
        transaction.region.deleteMany({ where: { id: regionId, brandKitId } }),
    );
  }

  createCustomVariable(businessId: string, dto: CreateCustomVariableDto) {
    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.customVariable.create({ data: { ...dto, brandKitId } }),
    );
  }

  updateCustomVariable(
    businessId: string,
    variableId: string,
    dto: UpdateCustomVariableDto,
  ) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const variable = await transaction.customVariable.findFirstOrThrow({
        where: { id: variableId, brandKitId },
        select: { id: true },
      });

      return transaction.customVariable.update({
        where: { id: variable.id },
        data: dto,
      });
    });
  }

  deleteCustomVariable(businessId: string, variableId: string) {
    return this.deleteScopedItem(
      businessId,
      variableId,
      "Custom variable",
      (transaction, brandKitId) =>
        transaction.customVariable.deleteMany({
          where: { id: variableId, brandKitId },
        }),
    );
  }

  createRule(businessId: string, dto: CreateRuleDto) {
    validateScopeTarget(dto, "Rule");

    return this.mutate(businessId, (transaction, brandKitId) =>
      transaction.rule.create({
        data: {
          ...dto,
          audienceId: dto.audienceId ?? null,
          regionId: dto.regionId ?? null,
          contentTypeId: dto.contentTypeId ?? null,
          brandKitId,
        },
      }),
    );
  }

  updateRule(businessId: string, ruleId: string, dto: UpdateRuleDto) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const rule = await transaction.rule.findFirstOrThrow({
        where: { id: ruleId, brandKitId },
      });
      validateScopeTarget({ ...rule, ...dto }, "Rule");

      return transaction.rule.update({
        where: { id: rule.id },
        data: dto,
      });
    });
  }

  deleteRule(businessId: string, ruleId: string) {
    return this.deleteScopedItem(
      businessId,
      ruleId,
      "Rule",
      (transaction, brandKitId) =>
        transaction.rule.deleteMany({ where: { id: ruleId, brandKitId } }),
    );
  }

  createSample(businessId: string, dto: CreateSampleDto) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const { audienceIds = [], regionIds = [], ...sample } = dto;
      const created = await transaction.sample.create({
        data: {
          ...sample,
          brandKitId,
        },
        select: { id: true },
      });

      if (audienceIds.length > 0) {
        await transaction.sampleAudience.createMany({
          data: audienceIds.map((audienceId) => ({
            sampleId: created.id,
            audienceId,
            brandKitId,
          })),
        });
      }

      if (regionIds.length > 0) {
        await transaction.sampleRegion.createMany({
          data: regionIds.map((regionId) => ({
            sampleId: created.id,
            regionId,
            brandKitId,
          })),
        });
      }

      const sampleWithLinks = await transaction.sample.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          audienceLinks: true,
          regionLinks: true,
        },
      });

      return toSample(sampleWithLinks);
    });
  }

  updateSample(businessId: string, sampleId: string, dto: UpdateSampleDto) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const sample = await transaction.sample.findFirstOrThrow({
        where: { id: sampleId, brandKitId },
        select: { id: true },
      });
      const { audienceIds, regionIds, ...fields } = dto;

      await transaction.sample.update({
        where: { id: sample.id },
        data: fields,
      });

      if (audienceIds !== undefined) {
        await transaction.sampleAudience.deleteMany({
          where: { sampleId: sample.id },
        });

        if (audienceIds.length > 0) {
          await transaction.sampleAudience.createMany({
            data: audienceIds.map((audienceId) => ({
              sampleId: sample.id,
              audienceId,
              brandKitId,
            })),
          });
        }
      }

      if (regionIds !== undefined) {
        await transaction.sampleRegion.deleteMany({
          where: { sampleId: sample.id },
        });

        if (regionIds.length > 0) {
          await transaction.sampleRegion.createMany({
            data: regionIds.map((regionId) => ({
              sampleId: sample.id,
              regionId,
              brandKitId,
            })),
          });
        }
      }

      const updated = await transaction.sample.findUniqueOrThrow({
        where: { id: sample.id },
        include: {
          audienceLinks: true,
          regionLinks: true,
        },
      });

      return toSample(updated);
    });
  }

  deleteSample(businessId: string, sampleId: string) {
    return this.deleteScopedItem(
      businessId,
      sampleId,
      "Sample",
      (transaction, brandKitId) =>
        transaction.sample.deleteMany({ where: { id: sampleId, brandKitId } }),
    );
  }

  private deleteScopedItem(
    businessId: string,
    itemId: string,
    label: string,
    remove: (
      transaction: DraftTransaction,
      brandKitId: string,
    ) => Promise<{ count: number }>,
  ) {
    return this.mutate(businessId, async (transaction, brandKitId) => {
      const result = await remove(transaction, brandKitId);
      if (result.count === 0) {
        throw new NotFoundException(`${label} not found`);
      }

      return { id: itemId };
    });
  }

  private async mutate<T>(
    businessId: string,
    mutation: (transaction: DraftTransaction, brandKitId: string) => Promise<T>,
  ) {
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const brandKit = await transaction.brandKit.findUnique({
            where: { businessId },
            select: { id: true },
          });
          if (!brandKit) {
            throw new NotFoundException("Brand kit not found");
          }

          const item = await mutation(transaction, brandKit.id);
          const revision = await transaction.brandKit.update({
            where: { id: brandKit.id },
            data: { draftRevision: { increment: 1 } },
            select: { draftRevision: true },
          });

          return { item, draftRevision: revision.draftRevision };
        },
        {
          maxWait: TRANSACTION_MAX_WAIT_MS,
          timeout: TRANSACTION_TIMEOUT_MS,
        },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("This draft item already exists");
        }
        if (error.code === "P2003" || error.code === "P2004") {
          throw new BadRequestException(
            "This draft item references an invalid target",
          );
        }
        if (error.code === "P2025") {
          throw new NotFoundException("Draft item not found");
        }
      }

      throw error;
    }
  }
}

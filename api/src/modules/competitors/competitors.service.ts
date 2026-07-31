import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Injectable()
export class CompetitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompetitors(businessId: string) {
    const competitors = await this.prisma.competitor.findMany({
      where: { businessId },
      orderBy: { createdAt: "asc" },
    });

    return competitors.map((competitor) => ({
      ...competitor,
      aliases:
        competitor.aliases.length > 0 ? competitor.aliases : [competitor.name],
    }));
  }

  async createCompetitor(
    businessId: string,
    input: { name: string; domain: string; aliases: string[] },
  ) {
    const normalizedName = input.name.trim().replace(/\s+/g, " ");
    const normalizedAliases = Array.from(
      new Map(
        input.aliases
          .map((alias) => alias.trim().replace(/\s+/g, " "))
          .filter(Boolean)
          .map((alias) => [alias.toLocaleLowerCase(), alias]),
      ).values(),
    );

    if (!normalizedName) {
      throw new BadRequestException("Competitor name is required");
    }
    if (normalizedAliases.length === 0) {
      throw new BadRequestException("At least one tracked name is required");
    }

    try {
      return await this.prisma.competitor.create({
        data: {
          businessId,
          name: normalizedName,
          domain: input.domain.toLocaleLowerCase(),
          aliases: normalizedAliases,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "A competitor with this domain already exists",
        );
      }
      throw error;
    }
  }

  async updateCompetitor(
    businessId: string,
    competitorId: string,
    update: { name?: string; domain?: string; aliases?: string[] },
  ) {
    if (
      update.name === undefined &&
      update.domain === undefined &&
      update.aliases === undefined
    ) {
      throw new BadRequestException("No competitor changes were provided");
    }

    const normalizedName = update.name?.trim().replace(/\s+/g, " ");
    if (update.name !== undefined && !normalizedName) {
      throw new BadRequestException("Competitor name is required");
    }

    const normalizedAliases = update.aliases
      ? Array.from(
          new Map(
            update.aliases
              .map((alias) => alias.trim().replace(/\s+/g, " "))
              .filter(Boolean)
              .map((alias) => [alias.toLocaleLowerCase(), alias]),
          ).values(),
        )
      : undefined;
    if (update.aliases !== undefined && normalizedAliases?.length === 0) {
      throw new BadRequestException("At least one tracked name is required");
    }

    try {
      return await this.prisma.competitor.update({
        where: { id: competitorId, businessId },
        data: {
          ...(normalizedName === undefined ? {} : { name: normalizedName }),
          ...(update.domain === undefined
            ? {}
            : { domain: update.domain.toLocaleLowerCase() }),
          ...(normalizedAliases === undefined
            ? {}
            : { aliases: normalizedAliases }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "A competitor with this domain already exists",
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Competitor not found");
      }
      throw error;
    }
  }

  async deleteCompetitor(businessId: string, competitorId: string) {
    const result = await this.prisma.competitor.deleteMany({
      where: { id: competitorId, businessId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Competitor not found");
    }
  }
}

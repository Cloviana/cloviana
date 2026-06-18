import { randomBytes } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { SupabaseService } from "@/clients/supabase/supabase.service";
import { isWorkEmail } from "@/common/email/work-email";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import {
  ADMIN_EMAIL,
  normalizeEmail,
} from "@/modules/auth/constants/access.constants";
import { MonitoringEnqueueService } from "@/modules/monitoring/services/monitoring-enqueue.service";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  BusinessSetupStatus,
  BusinessSetupStep,
  BusinessStatus,
  PromptAwarenessStage,
  PromptStatus,
} from "@prisma/client";
import type { SetupClientDto } from "./dto/setup-client.dto";

type SupabaseAdminUser = {
  id: string;
  email?: string;
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly monitoringEnqueue: MonitoringEnqueueService,
  ) {}

  async setupClient(user: AuthUser, dto: SetupClientDto) {
    this.assertAdmin(user);

    const email = normalizeEmail(dto.email);
    if (!isWorkEmail(email)) {
      throw new BadRequestException("Client email must be a business email");
    }

    if (dto.searchIntentCommercial + dto.searchIntentInformational !== 100) {
      throw new BadRequestException(
        "Commercial and informational intent must total 100",
      );
    }

    const domain = normalizeDomain(dto.domain);
    if (!domain) {
      throw new BadRequestException("Business domain is invalid");
    }

    const normalizedCompetitors = this.normalizeCompetitors(
      dto.competitors,
      domain,
    );
    const promptsByTopic = this.normalizeTopics(dto.topics);
    const promptCount = promptsByTopic.reduce(
      (count, topic) => count + topic.prompts.length,
      0,
    );

    if (promptCount < 3) {
      throw new BadRequestException("Create at least 3 prompts");
    }

    if (promptCount > 50) {
      throw new BadRequestException("Create no more than 50 prompts");
    }

    const password = dto.password || this.generatePassword();
    const clientUser = await this.upsertSupabaseUser(email, password);

    const result = await this.prisma.$transaction(
      async (tx) => {
        const profileWithEmail = await tx.profile.findUnique({
          where: { email },
          select: { id: true },
        });

        if (profileWithEmail && profileWithEmail.id !== clientUser.id) {
          await tx.profile.update({
            where: { id: profileWithEmail.id },
            data: { id: clientUser.id },
          });
        }

        await tx.profile.upsert({
          where: { id: clientUser.id },
          update: { email },
          create: { id: clientUser.id, email },
        });

        const business = await tx.business.create({
          data: {
            ownerId: clientUser.id,
            name: dto.brandName.trim(),
            domain,
            profileUrl: dto.profileUrl?.trim() || null,
            location: dto.location.trim(),
            timezone: dto.timezone.trim(),
            description: dto.description.trim(),
            industry: dto.industry,
            category: dto.category.trim(),
            distributionChannels: this.uniqueTrimmed(dto.distributionChannels),
            searchIntentCommercial: dto.searchIntentCommercial,
            searchIntentInformational: dto.searchIntentInformational,
            setupStatus: BusinessSetupStatus.COMPLETED,
            setupStep: BusinessSetupStep.COMPLETED,
            status: BusinessStatus.ACTIVE,
            setupCompletedAt: new Date(),
            competitors: {
              create: normalizedCompetitors,
            },
          },
        });

        await tx.profile.update({
          where: { id: clientUser.id },
          data: { lastAccessedBusinessId: business.id },
        });

        const promptIds: string[] = [];

        for (const topic of promptsByTopic) {
          const tag = await tx.tag.create({
            data: { businessId: business.id, text: topic.name },
          });

          for (const prompt of topic.prompts) {
            const createdPrompt = await tx.prompt.create({
              data: {
                businessId: business.id,
                text: prompt.text,
                status: PromptStatus.ACTIVE,
                awarenessStage: prompt.stage,
                tags: { connect: { id: tag.id } },
              },
              select: { id: true },
            });

            promptIds.push(createdPrompt.id);
          }
        }

        return { business, promptIds };
      },
      { timeout: 60000 },
    );

    let monitoring:
      | Awaited<ReturnType<MonitoringEnqueueService["enqueue"]>>
      | {
          enqueued: false;
          jobId: null;
          reason: "enqueue_failed";
          error: string;
        };

    try {
      monitoring = await this.monitoringEnqueue.enqueue(
        result.business.id,
        result.promptIds,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Admin client setup monitoring enqueue failed businessId=${result.business.id}: ${message}`,
      );
      monitoring = {
        enqueued: false,
        jobId: null,
        reason: "enqueue_failed",
        error: message,
      };
    }

    return {
      client: {
        email,
        password,
        userId: clientUser.id,
      },
      business: {
        id: result.business.id,
        name: result.business.name,
        domain: result.business.domain,
      },
      counts: {
        competitors: normalizedCompetitors.length,
        topics: promptsByTopic.length,
        prompts: result.promptIds.length,
      },
      monitoring,
      dashboardPath: `/b/${result.business.id}`,
    };
  }

  private assertAdmin(user: AuthUser) {
    if (normalizeEmail(user.email) !== ADMIN_EMAIL) {
      throw new ForbiddenException("Only Samuel can provision client accounts");
    }
  }

  private generatePassword() {
    return `${randomBytes(18).toString("base64url")}Aa9!`;
  }

  generateSecurePassword(user: AuthUser) {
    this.assertAdmin(user);
    return { password: this.generatePassword() };
  }

  async listUsers(user: AuthUser, search?: string) {
    this.assertAdmin(user);

    const where: Parameters<PrismaService["profile"]["findMany"]>[0]["where"] =
      {
        email: { not: ADMIN_EMAIL },
      };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        {
          businessesOwned: {
            some: { name: { contains: search, mode: "insensitive" } },
          },
        },
        {
          businessesOwned: {
            some: { domain: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    const profiles = await this.prisma.profile.findMany({
      where,
      select: {
        id: true,
        email: true,
        createdAt: true,
        businessesOwned: {
          select: {
            id: true,
            name: true,
            domain: true,
            status: true,
            monitoringEnabled: true,
            _count: { select: { prompts: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return profiles.map((profile) => ({
      id: profile.id,
      email: profile.email,
      createdAt: profile.createdAt,
      businesses: profile.businessesOwned.map((biz) => ({
        id: biz.id,
        name: biz.name,
        domain: biz.domain,
        status: biz.status,
        monitoringEnabled: biz.monitoringEnabled,
        promptCount: biz._count.prompts,
      })),
    }));
  }

  async deleteUser(user: AuthUser, profileId: string) {
    this.assertAdmin(user);

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, email: true },
    });

    if (!profile) {
      throw new NotFoundException("User not found");
    }

    if (normalizeEmail(profile.email) === ADMIN_EMAIL) {
      throw new ForbiddenException("Cannot delete admin account");
    }

    try {
      const supabaseUser = await this.findSupabaseUserByEmail(profile.email);
      if (supabaseUser) {
        const admin = this.supabase.getAdminClient().auth.admin;
        await admin.deleteUser(supabaseUser.id);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete Supabase auth user for ${profile.email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    await this.prisma.profile.delete({ where: { id: profileId } });

    return { deleted: true, email: profile.email };
  }

  async toggleMonitoring(user: AuthUser, businessId: string, enabled: boolean) {
    this.assertAdmin(user);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    await this.prisma.business.update({
      where: { id: businessId },
      data: { monitoringEnabled: enabled },
    });

    return { success: true, monitoringEnabled: enabled };
  }

  private async upsertSupabaseUser(email: string, password: string) {
    const admin = this.supabase.getAdminClient().auth.admin;
    const existing = await this.findSupabaseUserByEmail(email);

    if (existing) {
      const { data, error } = await admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { provisioned_by: "cloviana_admin" },
      });

      if (error || !data.user) {
        throw new InternalServerErrorException(
          error?.message || "Failed to update Supabase user",
        );
      }

      return data.user as SupabaseAdminUser;
    }

    const { data, error } = await admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { provisioned_by: "cloviana_admin" },
    });

    if (error || !data.user) {
      throw new InternalServerErrorException(
        error?.message || "Failed to create Supabase user",
      );
    }

    return data.user as SupabaseAdminUser;
  }

  private async findSupabaseUserByEmail(email: string) {
    const admin = this.supabase.getAdminClient().auth.admin;
    let page = 1;

    while (page <= 20) {
      const { data, error } = await admin.listUsers({ page, perPage: 1000 });
      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      const users = data.users as Array<{ id: string; email?: string | null }>;
      const user = users.find(
        (candidate) => normalizeEmail(candidate.email ?? "") === email,
      );
      if (user) return user as SupabaseAdminUser;
      if (users.length < 1000) return null;
      page += 1;
    }

    return null;
  }

  private normalizeCompetitors(
    competitors: SetupClientDto["competitors"],
    ownDomain: string,
  ) {
    const byDomain = new Map<string, { domain: string; name: string }>();

    for (const competitor of competitors) {
      const domain = normalizeDomain(competitor.domain);
      if (!domain || domain === ownDomain || byDomain.has(domain)) continue;
      byDomain.set(domain, { domain, name: competitor.name.trim() });
    }

    return [...byDomain.values()];
  }

  private normalizeTopics(topics: SetupClientDto["topics"]) {
    const seenTopicNames = new Set<string>();
    const seenPrompts = new Set<string>();

    return topics
      .map((topic) => {
        const name = topic.name.trim();
        const normalizedName = name.toLowerCase();
        if (seenTopicNames.has(normalizedName)) return null;
        seenTopicNames.add(normalizedName);

        const prompts = topic.prompts
          .map((prompt) => ({
            text: prompt.text.trim(),
            stage: prompt.stage ?? PromptAwarenessStage.EVALUATE,
          }))
          .filter((prompt) => {
            const key = prompt.text.toLowerCase();
            if (seenPrompts.has(key)) return false;
            seenPrompts.add(key);
            return true;
          });

        return prompts.length ? { name, prompts } : null;
      })
      .filter(
        (
          topic,
        ): topic is {
          name: string;
          prompts: { text: string; stage: PromptAwarenessStage }[];
        } => Boolean(topic),
      );
  }

  private uniqueTrimmed(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()))).filter(
      Boolean,
    );
  }
}

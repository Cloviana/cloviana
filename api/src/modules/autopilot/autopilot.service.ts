import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import {
  AutopilotContentMix,
  AutopilotSettings,
  AutopilotBlogSettings,
  DayOfWeek,
} from "@prisma/client";

import { UpdateAutopilotDto } from "./dtos/update-autopilot.dto";

type AutopilotBlogSettingsResponse = {
  collectionIds: string[];
  contentMix: AutopilotContentMix;
  publishDays: DayOfWeek[];
  autoPublish: boolean;
};

type AutopilotSettingsResponse = {
  enabled: boolean;
  blog: AutopilotBlogSettingsResponse | null;
};

@Injectable()
export class AutopilotService {
  constructor(private readonly prisma: PrismaService) {}

  private mapResponse(
    settings: AutopilotSettings & {
      blog: (AutopilotBlogSettings & {
        collections: { id: string }[];
      }) | null;
    },
  ): AutopilotSettingsResponse {
    return {
      enabled: settings.enabled,
      blog: settings.blog
        ? {
            collectionIds: settings.blog.collections.map((c) => c.id),
            contentMix: settings.blog.contentMix,
            publishDays: settings.blog.publishDays,
            autoPublish: settings.blog.autoPublish,
          }
        : null,
    };
  }

  async getSettings(storeId: string): Promise<AutopilotSettingsResponse> {
    const settings = await this.prisma.autopilotSettings.upsert({
      where: { storeId },
      update: {},
      create: {
        storeId,
        blog: {
          create: {},
        },
      },
      include: {
        blog: {
          include: {
            collections: {
              select: { id: true },
            },
          },
        },
      },
    });

    return this.mapResponse(settings);
  }

  async updateSettings(
    storeId: string,
    { enabled, blog }: UpdateAutopilotDto,
  ): Promise<AutopilotSettingsResponse> {
    const collectionIds = blog?.collectionIds ?? [];
    const publishDays = blog?.publishDays ?? [];

    const settings = await this.prisma.autopilotSettings.upsert({
      where: { storeId },
      create: {
        storeId,
        enabled,
        ...(blog
            ? {
                blog: {
                  create: {
                    publishDays,
                    contentMix: blog.contentMix!,
                    autoPublish: blog.autoPublish!,
                    ...(collectionIds.length
                      ? {
                          collections: {
                            connect: collectionIds.map((id) => ({ id })),
                          },
                        }
                      : {}),
                  },
              },
            }
          : {}),
      },
      update: {
        enabled,
        ...(blog
            ? {
                blog: {
                  upsert: {
                    create: {
                      publishDays,
                      contentMix: blog.contentMix!,
                      autoPublish: blog.autoPublish!,
                      ...(collectionIds.length
                        ? {
                            collections: {
                              connect: collectionIds.map((id) => ({ id })),
                            },
                          }
                        : {}),
                    },
                    update: {
                      publishDays,
                      contentMix: blog.contentMix!,
                      autoPublish: blog.autoPublish!,
                      collections: {
                        set: collectionIds.map((id) => ({ id })),
                      },
                    },
                  },
                },
            }
          : {}),
      },
      include: {
        blog: {
          include: {
            collections: {
              select: { id: true },
            },
          },
        },
      },
    });

    return this.mapResponse(settings);
  }
}

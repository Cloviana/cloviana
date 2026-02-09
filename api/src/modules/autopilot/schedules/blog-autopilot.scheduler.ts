import { PrismaService } from "@/clients/prisma/prisma.service";
import { AutopilotBlogWorkflow } from "@/workflows/autopilot-blog/autopilot-blog.workflow";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DayOfWeek } from "@prisma/client";
import pLimit from "p-limit";

@Injectable()
export class BlogAutopilotScheduler {
  private readonly logger = new Logger(BlogAutopilotScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autopilotBlog: AutopilotBlogWorkflow,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handle() {
    const today = this.getUtcDayOfWeek();
    const startOfTodayUtc = this.getStartOfTodayUtc();

    const settings = await this.prisma.autopilotSettings.findMany({
      where: {
        enabled: true,
        blog: {
          is: {
            publishDays: { has: today },
            OR: [
              { lastRunAt: null },
              { lastRunAt: { lt: startOfTodayUtc } },
            ],
          },
        },
      },
      select: {
        storeId: true,
        blog: { select: { publishDays: true, lastRunAt: true } },
      },
    });

    if (!settings.length) return;

    const dueStoreIds = settings.map((setting) => setting.storeId);

    if (!dueStoreIds.length) return;

    this.logger.log(
      `Cloviana blog autopilot: due stores=${dueStoreIds.join(", ")}`,
    );

    const limit = pLimit(3);
    await Promise.all(
      dueStoreIds.map((storeId) =>
        limit(async () => {
          try {
            await this.autopilotBlog.run(storeId);
          } catch (error: any) {
            this.logger.error(
              `Cloviana autopilot failed for store ${storeId}: ${
                error?.message ?? error
              }`,
            );
          }
        }),
      ),
    );
  }

  private getUtcDayOfWeek(): DayOfWeek {
    const dayIndex = new Date().getUTCDay();
    const order: DayOfWeek[] = [
      "SUN",
      "MON",
      "TUE",
      "WED",
      "THU",
      "FRI",
      "SAT",
    ];
    return order[dayIndex];
  }

  private getStartOfTodayUtc(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }
}

import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

const topicSelect = {
  id: true,
  businessId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { promptTopics: true } },
} satisfies Prisma.TopicSelect;

type TopicRecord = Prisma.TopicGetPayload<{ select: typeof topicSelect }>;

function mapTopic({ _count, ...topic }: TopicRecord) {
  return { ...topic, _count: { prompts: _count.promptTopics } };
}

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopics(businessId: string) {
    const topics = await this.prisma.topic.findMany({
      where: { businessId },
      select: topicSelect,
      orderBy: { name: "asc" },
    });

    return topics.map(mapTopic);
  }

  async createTopic(businessId: string, name: string) {
    const normalizedName = this.normalizeTopicName(name);

    try {
      const topic = await this.prisma.topic.create({
        data: { businessId, name: normalizedName },
        select: topicSelect,
      });

      return mapTopic(topic);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("A topic with this name already exists");
      }
      throw error;
    }
  }

  async deleteTopic(businessId: string, topicId: string): Promise<void> {
    const result = await this.prisma.topic.deleteMany({
      where: { id: topicId, businessId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Topic not found");
    }
  }

  private normalizeTopicName(name: string): string {
    const normalizedName = name.trim().replace(/\s+/g, " ");

    if (!normalizedName) {
      throw new BadRequestException("Topic name is required");
    }
    if (normalizedName.length > 100) {
      throw new BadRequestException(
        "Topic name cannot be longer than 100 characters",
      );
    }

    return normalizedName;
  }
}

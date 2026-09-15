import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

const tagSelect = {
  id: true,
  businessId: true,
  text: true,
  createdAt: true,
  _count: { select: { promptTags: true } },
} satisfies Prisma.TagSelect;

type TagRecord = Prisma.TagGetPayload<{ select: typeof tagSelect }>;

function mapTag({ _count, ...tag }: TagRecord) {
  return { ...tag, _count: { prompts: _count.promptTags } };
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTags(businessId: string) {
    const tags = await this.prisma.tag.findMany({
      where: { businessId },
      select: tagSelect,
      orderBy: { text: "asc" },
    });

    return tags.map(mapTag);
  }

  async createTag(businessId: string, text: string) {
    const normalizedText = this.normalizeTagText(text);

    try {
      const tag = await this.prisma.tag.create({
        data: { businessId, text: normalizedText },
        select: tagSelect,
      });

      return mapTag(tag);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("A tag with this text already exists");
      }
      throw error;
    }
  }

  async deleteTag(businessId: string, tagId: string): Promise<void> {
    const result = await this.prisma.tag.deleteMany({
      where: { id: tagId, businessId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Tag not found");
    }
  }

  private normalizeTagText(text: string): string {
    const normalizedText = text.trim().replace(/\s+/g, " ");

    if (!normalizedText) {
      throw new BadRequestException("Tag text is required");
    }
    if (normalizedText.length > 100) {
      throw new BadRequestException(
        "Tag text cannot be longer than 100 characters",
      );
    }

    return normalizedText;
  }
}

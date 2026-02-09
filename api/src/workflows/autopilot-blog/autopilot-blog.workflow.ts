import { PrismaService } from "@/clients/prisma/prisma.service";
import { SmtpService } from "@/clients/smtp/smtp.service";
import { BlogsService } from "@/modules/blogs/services/blogs.service";
import { SuggestionsService } from "@/modules/blogs/services/suggestions.service";
import { Injectable } from "@nestjs/common";
import { BlogGenerationWorkflow } from "@/workflows/blog-generation/blog-generation.workflow";
import { graph } from "./autopilot-blog.graph";

@Injectable()
export class AutopilotBlogWorkflow {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suggestions: SuggestionsService,
    private readonly blogs: BlogsService,
    private readonly blogGeneration: BlogGenerationWorkflow,
    private readonly smtp: SmtpService,
  ) {}

  async run(storeId: string) {
    return await graph.invoke(
      { _storeId: storeId },
      {
        configurable: {
          prisma: this.prisma,
          suggestions: this.suggestions,
          blogs: this.blogs,
          blogGeneration: this.blogGeneration,
          smtp: this.smtp,
        },
      },
    );
  }
}

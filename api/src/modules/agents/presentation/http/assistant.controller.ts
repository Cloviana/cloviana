import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Sse,
} from "@nestjs/common";
import { Assistant } from "../../application/assistant/assistant";
import { createRunEventStream } from "./agent-run-stream";
import {
  ConversationDto,
  ConversationQuery,
  EventQuery,
  ReferenceDto,
  StartRunDto,
} from "./dto/assistant.dto";

@Controller("marketplaces/:slug/assistant")
export class AssistantController {
  constructor(private readonly assistant: Assistant) {}
  private access(user: AuthUser, slug: string) {
    return { ownerId: user.sub, slug };
  }
  @Get("conversations")
  list(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Query() query: ConversationQuery,
  ) {
    return this.assistant.conversations(this.access(user, slug), query.themeId);
  }
  @Post("conversations")
  create(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: ConversationDto,
  ) {
    return this.assistant.createConversation(
      this.access(user, slug),
      body.title,
    );
  }
  @Post("conversations/:conversationId/attachments")
  prepareReference(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Body() body: ReferenceDto,
  ) {
    return this.assistant.prepareAttachment({
      ...this.access(user, slug),
      conversationId,
      ...body,
    });
  }
  @Get("conversations/:conversationId/attachments/:attachmentId")
  reference(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Param("attachmentId", ParseUUIDPipe) attachmentId: string,
  ) {
    return this.assistant.attachment(
      this.access(user, slug),
      conversationId,
      attachmentId,
    );
  }
  @Post("conversations/:conversationId/attachments/:attachmentId/complete")
  completeReference(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Param("attachmentId", ParseUUIDPipe) attachmentId: string,
  ) {
    return this.assistant.completeAttachment(
      this.access(user, slug),
      conversationId,
      attachmentId,
    );
  }
  @Get("conversations/:conversationId/messages")
  messages(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Query() query: EventQuery,
  ) {
    return this.assistant.messages(
      this.access(user, slug),
      conversationId,
      BigInt(query.after || "0"),
    );
  }
  @Post("conversations/:conversationId/runs")
  start(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Body() body: StartRunDto,
  ) {
    return this.assistant.start({
      ...this.access(user, slug),
      conversationId,
      ...body,
    });
  }
  @Get("conversations/:conversationId/runs/active")
  activeRun(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
  ) {
    return this.assistant.activeRun(this.access(user, slug), conversationId);
  }
  @Get("runs/:runId")
  run(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("runId", ParseUUIDPipe) runId: string,
  ) {
    return this.assistant.run(this.access(user, slug), runId);
  }
  @Get("runs/:runId/usage")
  usage(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("runId", ParseUUIDPipe) runId: string,
  ) {
    return this.assistant.usage(this.access(user, slug), runId);
  }
  @Post("runs/:runId/cancel")
  cancel(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("runId", ParseUUIDPipe) runId: string,
  ) {
    return this.assistant.cancel(this.access(user, slug), runId);
  }
  @Get("runs/:runId/events")
  events(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("runId", ParseUUIDPipe) runId: string,
    @Query() query: EventQuery,
  ) {
    return this.assistant.events(
      this.access(user, slug),
      runId,
      BigInt(query.after || "0"),
    );
  }
  @Sse("runs/:runId/stream")
  async stream(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("runId", ParseUUIDPipe) runId: string,
    @Query() query: EventQuery,
    @Headers("last-event-id") lastId?: string,
  ) {
    const access = this.access(user, slug);
    await this.assistant.run(access, runId);
    const after = BigInt(
      query.after || (lastId && /^\d{1,18}$/.test(lastId) ? lastId : "0"),
    );
    return createRunEventStream(
      {
        readRun: () => this.assistant.run(access, runId),
        readEvents: (cursor) => this.assistant.events(access, runId, cursor),
      },
      after,
    );
  }
}

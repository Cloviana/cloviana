import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import type { AuthUser } from "@/common/interfaces/auth-user.interface";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { IsArray, IsOptional, IsString } from "class-validator";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ChatRateLimiter } from "./chat-rate-limiter.service";
import { ChatService, type IncomingMessage } from "./chat.service";

class SendMessageDto {
  @IsOptional()
  @IsString()
  chatId?: string;

  @IsArray()
  messages!: IncomingMessage[];

  @IsOptional()
  @IsString()
  mode?: string;
}

@Controller("businesses/:businessId")
@UseGuards(BusinessAccessGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly rateLimiter: ChatRateLimiter,
  ) {}

  @Post("chat")
  async send(
    @Param("businessId") businessId: string,
    @Body() body: SendMessageDto,
    @Req() request: FastifyRequest & { user: AuthUser },
  ) {
    const release = await this.rateLimiter.acquire(
      request.user.sub,
      businessId,
    );
    try {
      return await this.chat.send(businessId, body);
    } finally {
      await release();
    }
  }

  @Post("chat/stream")
  async stream(
    @Param("businessId") businessId: string,
    @Body() body: SendMessageDto,
    @Req() request: FastifyRequest & { user: AuthUser },
    @Res() reply: FastifyReply,
  ) {
    const release = await this.rateLimiter.acquire(
      request.user.sub,
      businessId,
    );
    try {
      await this.chat.stream(businessId, body, reply);
    } finally {
      await release();
    }
  }

  @Get("chats")
  list(@Param("businessId") businessId: string) {
    return this.chat.list(businessId);
  }

  @Get("chats/:chatId")
  get(
    @Param("businessId") businessId: string,
    @Param("chatId") chatId: string,
  ) {
    return this.chat.get(businessId, chatId);
  }
}

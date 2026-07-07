import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { IsArray, IsOptional, IsString } from "class-validator";
import type { FastifyReply } from "fastify";
import { ChatService, type IncomingMessage } from "./chat.service";

class SendMessageDto {
  @IsOptional()
  @IsString()
  chatId?: string;

  @IsArray()
  messages!: IncomingMessage[];
}

@Controller("businesses/:businessId")
@UseGuards(BusinessAccessGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post("chat")
  async send(
    @Param("businessId") businessId: string,
    @Body() body: SendMessageDto,
  ) {
    return await this.chat.send(businessId, body);
  }

  @Post("chat/stream")
  async stream(
    @Param("businessId") businessId: string,
    @Body() body: SendMessageDto,
    @Res() reply: FastifyReply,
  ) {
    await this.chat.stream(businessId, body, reply);
  }

  @Get("chats")
  list(@Param("businessId") businessId: string) {
    return this.chat.list(businessId);
  }

  @Get("chats/:chatId")
  async get(
    @Param("businessId") businessId: string,
    @Param("chatId") chatId: string,
  ) {
    return await this.chat.get(businessId, chatId);
  }

  @Delete("chats/:chatId")
  async remove(
    @Param("businessId") businessId: string,
    @Param("chatId") chatId: string,
  ) {
    return await this.chat.remove(businessId, chatId);
  }
}

import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/common/config/app.configuration";
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ChatMessageRole } from "@prisma/client";

type IncomingPart = {
  type?: string;
  text?: string;
};

export type IncomingMessage = {
  role?: string;
  content?: readonly IncomingPart[];
};

type SendMessage = {
  chatId?: string;
  messages: readonly IncomingMessage[];
};

const TITLE_MAX_LENGTH = 40;

function messageText(message?: IncomingMessage) {
  return (message?.content ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function userText(messages: readonly IncomingMessage[], latest: boolean) {
  const ordered = latest ? [...messages].reverse() : messages;
  return messageText(ordered.find((message) => message.role === "user"));
}

function titleFrom(text: string) {
  if (text.length <= TITLE_MAX_LENGTH) return text;
  return `${text.slice(0, TITLE_MAX_LENGTH).trimEnd()}...`;
}

function content(text: string) {
  return [{ type: "text", text }];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: AppConfiguration,
  ) {
    this.baseUrl = `${config.agentUrl.replace(/\/$/, "")}/`;
  }

  @Cron("0 0 * * *")
  async deleteStaleChats(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.logger.log(`Starting cleanup of chats older than 30 days (cutoff: ${cutoff.toISOString()})...`);
    try {
      const result = await this.prisma.chat.deleteMany({
        where: {
          updatedAt: { lt: cutoff },
        },
      });
      this.logger.log(`Successfully cleaned up ${result.count} stale chats.`);
    } catch (err: any) {
      this.logger.error(`Failed to clean up stale chats: ${err.message}`, err.stack);
    }
  }

  list(businessId: string) {
    return this.prisma.chat.findMany({
      where: { businessId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async get(businessId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, businessId },
      select: {
        id: true,
        title: true,
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!chat) throw new NotFoundException("Chat not found");
    return chat;
  }

  async send(businessId: string, body: SendMessage) {
    const text = userText(body.messages, true);
    if (!text) throw new BadRequestException("A user text message is required");

    const existing = body.chatId
      ? await this.prisma.chat.findFirst({
          where: { id: body.chatId, businessId },
          select: { id: true, title: true },
        })
      : null;
    if (body.chatId && !existing) throw new NotFoundException("Chat not found");

    const chatId = existing?.id ?? randomUUID();
    const title = existing?.title ?? titleFrom(userText(body.messages, false));
    const reply = await this.askAgent(businessId, chatId, text);

    await this.prisma.$transaction(async (prisma) => {
      await prisma.chat.upsert({
        where: { id: chatId },
        update: { updatedAt: new Date() },
        create: { id: chatId, businessId, title },
      });
      await prisma.chatMessage.createMany({
        data: [
          {
            chatId,
            role: ChatMessageRole.user,
            content: content(text),
          },
          {
            chatId,
            role: ChatMessageRole.assistant,
            content: content(reply),
          },
        ],
      });
    });

    return { chatId, title, content: content(reply) };
  }

  private async askAgent(
    businessId: string,
    sessionId: string,
    message: string,
  ) {
    const url = new URL("agent/chat", this.baseUrl);
    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, sessionId, message }),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (error) {
      this.logger.error(`Agent request failed: ${url}`, error);
      throw new BadGatewayException("Agent is unavailable");
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      this.logger.error(`Agent returned ${response.status}: ${detail}`);
      throw new BadGatewayException("Agent request failed");
    }

    const payload = (await response.json()) as { response?: unknown };
    if (typeof payload.response !== "string") {
      this.logger.error("Agent returned an invalid response");
      throw new BadGatewayException("Agent returned an invalid response");
    }
    return payload.response;
  }
}

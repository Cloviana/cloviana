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
import type { FastifyReply } from "fastify";

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

type BusinessOverview = {
  id: string;
  name: string;
  domain: string;
  category: string | null;
  description: string | null;
  icp: string | null;
  location: string | null;
  industry: string | null;
};

function clientOverview(business: BusinessOverview) {
  return [
    `Business name: ${business.name}`,
    `Business domain: ${business.domain}`,
    business.category && `Category: ${business.category}`,
    business.description && `Brand description: ${business.description}`,
    business.icp && `Ideal customer profile: ${business.icp}`,
    business.location && `Location: ${business.location}`,
    business.industry && `Industry: ${business.industry}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function parseSseBlock(block: string): { event: string; data: unknown } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
  }
  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
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

  // Validates the request, resolves chat identity, and fetches the client
  // overview. Fetched on every message so the agent always sees the latest
  // brand details; fails loudly (404) instead of running with empty context.
  private async prepare(businessId: string, body: SendMessage) {
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

    const business = await this.prisma.business.findFirst({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        domain: true,
        category: true,
        description: true,
        icp: true,
        location: true,
        industry: true,
      },
    });
    if (!business) throw new NotFoundException("Business not found");
    this.logger.log(
      `chat: client overview fetched business=${businessId} chat=${chatId}`,
    );

    return { text, chatId, title, clientContext: clientOverview(business) };
  }

  private async persist(
    businessId: string,
    chatId: string,
    title: string,
    userMessage: string,
    reply: string,
  ) {
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
            content: content(userMessage),
          },
          {
            chatId,
            role: ChatMessageRole.assistant,
            content: content(reply),
          },
        ],
      });
    });
  }

  async send(businessId: string, body: SendMessage) {
    const { text, chatId, title, clientContext } = await this.prepare(
      businessId,
      body,
    );

    const { reply, actions } = await this.askAgent(
      businessId,
      chatId,
      text,
      clientContext,
    );

    await this.persist(businessId, chatId, title, text, reply);
    return { chatId, title, content: content(reply), actions };
  }

  async stream(businessId: string, body: SendMessage, reply: FastifyReply) {
    // Validation errors are thrown before headers are sent, so they surface
    // as normal HTTP errors; after hijack() everything is SSE events.
    const { text, chatId, title, clientContext } = await this.prepare(
      businessId,
      body,
    );

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    const emit = (event: string, data: unknown) =>
      raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
      const url = new URL("agent/chat/stream", this.baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId,
          sessionId: chatId,
          message: text,
          clientContext,
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok || !response.body) {
        this.logger.error(`Agent stream returned ${response.status}`);
        emit("error", { detail: "Agent request failed" });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let separator: number;
        while ((separator = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, separator);
          buffer = buffer.slice(separator + 2);
          const event = parseSseBlock(block);
          if (!event) continue;
          if (event.event === "done") {
            const payload = event.data as {
              response?: unknown;
              actions?: unknown;
            };
            const replyText =
              typeof payload.response === "string" ? payload.response : "";
            const actions = Array.isArray(payload.actions)
              ? payload.actions.filter((action) => typeof action === "string")
              : [];
            await this.persist(businessId, chatId, title, text, replyText);
            emit("done", { chatId, title, content: content(replyText), actions });
            finished = true;
          } else if (event.event === "error") {
            this.logger.error(`Agent stream error: ${JSON.stringify(event.data)}`);
            emit("error", { detail: "Agent request failed" });
            finished = true;
          } else {
            emit(event.event, event.data);
          }
        }
      }
      if (!finished) emit("error", { detail: "Agent stream ended unexpectedly" });
    } catch (error) {
      this.logger.error("Agent stream failed", error);
      emit("error", { detail: "Agent request failed" });
    } finally {
      raw.end();
    }
  }

  private async askAgent(
    businessId: string,
    sessionId: string,
    message: string,
    clientContext: string,
  ) {
    const url = new URL("agent/chat", this.baseUrl);
    let response: Response;

    this.logger.log(
      `chat: injecting client context (${clientContext.length} chars) business=${businessId} chat=${sessionId}`,
    );
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, sessionId, message, clientContext }),
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

    const payload = (await response.json()) as {
      response?: unknown;
      actions?: unknown;
    };
    if (typeof payload.response !== "string") {
      this.logger.error("Agent returned an invalid response");
      throw new BadGatewayException("Agent returned an invalid response");
    }
    const actions = Array.isArray(payload.actions)
      ? payload.actions.filter((action) => typeof action === "string")
      : [];
    return { reply: payload.response, actions };
  }
}

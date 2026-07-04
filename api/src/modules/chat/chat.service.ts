import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/common/config/app.configuration";
import { BlogsService } from "@/modules/blogs/blogs.service";
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ChatMessageRole, type Prisma } from "@prisma/client";
import type { FastifyReply } from "fastify";

type IncomingPart = {
  type?: string;
  text?: string;
  image?: string;
  data?: string;
  mimeType?: string;
  filename?: string;
};

type AgentAttachment = {
  name?: string;
  mimeType?: string;
  dataUrl: string;
};

const MAX_ATTACHMENTS = 5;

function mimeFromDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+)/.exec(dataUrl);
  return match?.[1];
}

// Image and file parts from the latest user message become agent
// attachments; text parts are already covered by messageText().
function attachmentsFrom(messages: readonly IncomingMessage[]) {
  const latest = [...messages].reverse().find((m) => m.role === "user");
  const attachments: AgentAttachment[] = [];
  for (const part of latest?.content ?? []) {
    if (attachments.length >= MAX_ATTACHMENTS) break;
    if (part.type === "image" && part.image?.startsWith("data:")) {
      attachments.push({
        mimeType: mimeFromDataUrl(part.image),
        dataUrl: part.image,
      });
    } else if (part.type === "file" && part.data?.startsWith("data:")) {
      attachments.push({
        name: part.filename,
        mimeType: part.mimeType ?? mimeFromDataUrl(part.data),
        dataUrl: part.data,
      });
    }
  }
  return attachments;
}

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

export function parseSseBlock(
  block: string,
): { event: string; data: unknown } | null {
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
    private readonly blogs: BlogsService,
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

    // Both lookups hit a remote database; run them in parallel so the
    // stream starts one round trip sooner.
    const [existing, business] = await Promise.all([
      body.chatId
        ? this.prisma.chat.findFirst({
            where: { id: body.chatId, businessId },
            select: { id: true, title: true },
          })
        : Promise.resolve(null),
      this.prisma.business.findFirst({
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
      }),
    ]);
    if (body.chatId && !existing) throw new NotFoundException("Chat not found");

    const chatId = existing?.id ?? randomUUID();
    const title = existing?.title ?? titleFrom(userText(body.messages, false));

    if (!business) throw new NotFoundException("Business not found");
    this.logger.log(
      `chat: client overview fetched business=${businessId} chat=${chatId}`,
    );

    return { text, chatId, title, clientContext: clientOverview(business) };
  }

  // assistantContent is the full part list (reasoning, tool cards, text) so
  // the activity trail survives reloads, not just the answer text.
  private async persist(
    businessId: string,
    chatId: string,
    title: string,
    userMessage: string,
    assistantContent: Record<string, unknown>[],
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
            content: assistantContent as Prisma.InputJsonValue,
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
      attachmentsFrom(body.messages),
    );

    await this.persist(businessId, chatId, title, text, content(reply));
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
    // hijack() bypasses @fastify/cors, so reflect the origin ourselves or the
    // browser rejects the cross-origin stream ("Failed to fetch"). Safe: auth
    // is a Bearer token and we never set allow-credentials here.
    const origin = reply.request.headers.origin;
    raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      ...(origin
        ? { "access-control-allow-origin": origin, vary: "origin" }
        : {}),
    });
    const emit = (event: string, data: unknown) =>
      raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // Mirror of the frontend's part assembly: the persisted assistant
    // message keeps the reasoning + tool trail, not just the final text.
    const assistantParts: Record<string, unknown>[] = [];
    let liveText = "";
    const flushLiveText = () => {
      if (liveText.trim()) assistantParts.push({ type: "text", text: liveText });
      liveText = "";
    };

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
          attachments: attachmentsFrom(body.messages),
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
            for (const part of assistantParts) {
              if (part.type === "tool-call" && part.result === undefined) {
                part.result = { count: 0, results: [] };
              }
            }
            const fullContent = [...assistantParts, ...content(replyText)];
            await this.persist(businessId, chatId, title, text, fullContent);
            emit("done", { chatId, title, content: fullContent, actions });
            finished = true;
          } else if (event.event === "error") {
            this.logger.error(`Agent stream error: ${JSON.stringify(event.data)}`);
            emit("error", { detail: "Agent request failed" });
            finished = true;
          } else if (event.event === "route") {
            // Auto mode classified this message; blog requests become a
            // background job instead of occupying the chat stream.
            const data = event.data as { mode?: string; topic?: string };
            if (data.mode === "blog") {
              const topic = (data.topic || text).slice(0, 500);
              try {
                const { jobId } = await this.blogs.generate(businessId, topic);
                emit("blog_job", { jobId, topic });
              } catch (error) {
                this.logger.error("Failed to enqueue blog job from chat", error);
                emit("error", { detail: "Could not start the blog task" });
              }
            }
          } else {
            const data = event.data as Record<string, unknown>;
            if (event.event === "delta" && typeof data.text === "string") {
              liveText += data.text;
            } else if (
              event.event === "reasoning" &&
              typeof data.text === "string"
            ) {
              flushLiveText();
              const last = assistantParts[assistantParts.length - 1];
              if (last?.type === "reasoning") {
                last.text = `${last.text as string}${data.text}`;
              } else {
                assistantParts.push({ type: "reasoning", text: data.text });
              }
            } else if (event.event === "action") {
              flushLiveText();
              assistantParts.push({
                type: "tool-call",
                toolCallId: data.id ?? `action_${assistantParts.length}`,
                toolName: data.label ?? "Working",
                args: { detail: data.detail, tool: data.tool },
                argsText: "",
              });
            } else if (event.event === "action_result") {
              const part = assistantParts.find(
                (p) => p.type === "tool-call" && p.toolCallId === data.id,
              );
              if (part) {
                part.result = {
                  count: data.count ?? 0,
                  results: Array.isArray(data.results) ? data.results : [],
                  error: data.error === true,
                };
              }
            }
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
    attachments: AgentAttachment[] = [],
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
        body: JSON.stringify({
          businessId,
          sessionId,
          message,
          clientContext,
          attachments,
        }),
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

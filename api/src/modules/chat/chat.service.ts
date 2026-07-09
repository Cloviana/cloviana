import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/common/config/app.configuration";
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
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
const MAX_MESSAGE_CHARS = 50_000;

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

// Mirrors the agent's limits (3 images, ~6MB each, inline data URIs only).
const MAX_IMAGES = 3;
const MAX_IMAGE_DATA_CHARS = 8_000_000;
const IMAGE_DATA_URI = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

function userImages(messages: readonly IncomingMessage[]) {
  const latest = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const images = (latest?.content ?? [])
    .filter((part) => part.type === "image" && typeof part.image === "string")
    .map((part) => part.image as string);

  if (images.length > MAX_IMAGES) {
    throw new BadRequestException(`At most ${MAX_IMAGES} images per message`);
  }
  for (const image of images) {
    if (image.length > MAX_IMAGE_DATA_CHARS || !IMAGE_DATA_URI.test(image)) {
      throw new BadRequestException(
        "Images must be inline PNG/JPEG/WebP/GIF data URIs under 6MB",
      );
    }
  }
  return images;
}

type AgentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type AgentMessage = {
  role: "user" | "assistant";
  content: string | AgentPart[];
};

function persistedMessageText(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return "";
  return value
    .filter(
      (part): part is Prisma.JsonObject =>
        typeof part === "object" && part !== null && !Array.isArray(part),
    )
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => String(part.text))
    .join("\n")
    .slice(0, MAX_MESSAGE_CHARS);
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
  private readonly internalToken: string;
  private readonly activeStreams = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    config: AppConfiguration,
  ) {
    this.baseUrl = `${config.agentUrl.replace(/\/$/, "")}/`;
    this.internalToken = config.agentInternalToken;
  }

  @Cron("0 0 * * *")
  async deleteStaleChats(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.logger.log(
      `Starting cleanup of chats older than 30 days (cutoff: ${cutoff.toISOString()})...`,
    );
    try {
      const staleChats = await this.prisma.chat.findMany({
        where: {
          updatedAt: { lt: cutoff },
        },
        select: { id: true, businessId: true },
      });
      for (const chat of staleChats) {
        await this.cleanupAgentWorkspace(chat.businessId, chat.id, false);
      }
      const result = await this.prisma.chat.deleteMany({
        where: {
          id: { in: staleChats.map((chat) => chat.id) },
        },
      });
      this.logger.log(`Successfully cleaned up ${result.count} stale chats.`);
    } catch (err: any) {
      this.logger.error(
        `Failed to clean up stale chats: ${err.message}`,
        err.stack,
      );
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

  async remove(businessId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, businessId },
      select: { id: true },
    });
    if (!chat) throw new NotFoundException("Chat not found");

    await this.cleanupAgentWorkspace(businessId, chatId, true);
    await this.prisma.chat.delete({ where: { id: chatId } });
    return { id: chatId };
  }

  // The API owns conversation history. Only the latest user message is trusted
  // from the browser; prior turns come from the database.
  private async prepare(businessId: string, body: SendMessage) {
    const text = userText(body.messages, true);
    if (!text) throw new BadRequestException("A user text message is required");
    if (text.length > MAX_MESSAGE_CHARS) {
      throw new BadRequestException(
        `User messages must not exceed ${MAX_MESSAGE_CHARS} characters`,
      );
    }

    const existing = body.chatId
      ? await this.prisma.chat.findFirst({
          where: { id: body.chatId, businessId },
          select: {
            id: true,
            title: true,
            messages: {
              select: { role: true, content: true },
              orderBy: { createdAt: "asc" },
            },
          },
        })
      : null;
    if (body.chatId && !existing) throw new NotFoundException("Chat not found");

    const chatId = existing?.id ?? randomUUID();
    const title = existing?.title ?? titleFrom(text);
    const history: AgentMessage[] = (existing?.messages ?? [])
      .map((message): AgentMessage | null => {
        const messageContent = persistedMessageText(message.content);
        if (!messageContent) return null;
        return { role: message.role, content: messageContent };
      })
      .filter((message): message is AgentMessage => message !== null);
    // ponytail: images ride only on the turn they're sent; history rebuilds
    // text-only, so follow-up questions about an old image re-require it.
    const images = userImages(body.messages);
    const latestContent: string | AgentPart[] = images.length
      ? [
          { type: "text", text },
          ...images.map(
            (url): AgentPart => ({ type: "image_url", image_url: { url } }),
          ),
        ]
      : text;
    const messages = [
      ...history,
      { role: "user" as const, content: latestContent },
    ].slice(-200);

    return { text, chatId, title, messages };
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
    const { text, chatId, title, messages } = await this.prepare(
      businessId,
      body,
    );

    const { reply, actions } = await this.askAgent({
      businessId,
      chatId,
      messages,
    });

    await this.persist(businessId, chatId, title, text, content(reply));
    return { chatId, title, content: content(reply), actions };
  }

  async stream(businessId: string, body: SendMessage, reply: FastifyReply) {
    // Validation errors are thrown before headers are sent, so they surface
    // as normal HTTP errors; after hijack() everything is SSE events.
    const { text, chatId, title, messages } = await this.prepare(
      businessId,
      body,
    );

    // ponytail: in-memory guard is enough while chat streaming lives in one
    // process; move to a DB/Redis lock if the API is ever scaled out.
    if (this.activeStreams.has(chatId)) {
      throw new ConflictException("A response is already streaming for this chat");
    }
    this.activeStreams.add(chatId);

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
      if (liveText.trim())
        assistantParts.push({ type: "text", text: liveText });
      liveText = "";
    };

    // Stop reading from the agent when the browser disconnects, instead of
    // holding the upstream stream open for a client that is gone.
    const clientGone = new AbortController();
    raw.on("close", () => clientGone.abort());

    try {
      const url = new URL(
        `agent/chats/${encodeURIComponent(chatId)}/messages/stream`,
        this.baseUrl,
      );
      const response = await fetch(url, {
        method: "POST",
        headers: this.agentHeaders(),
        body: JSON.stringify({
          businessId,
          messages,
        }),
        signal: AbortSignal.any([
          clientGone.signal,
          AbortSignal.timeout(120_000),
        ]),
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
        let separator = buffer.indexOf("\n\n");
        while (separator >= 0) {
          const block = buffer.slice(0, separator);
          buffer = buffer.slice(separator + 2);
          const event = parseSseBlock(block);
          separator = buffer.indexOf("\n\n");
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
            this.logger.error(
              `Agent stream error: ${JSON.stringify(event.data)}`,
            );
            emit("error", { detail: "Agent request failed" });
            finished = true;
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
      if (!finished)
        emit("error", { detail: "Agent stream ended unexpectedly" });
    } catch (error) {
      if (clientGone.signal.aborted) {
        this.logger.log(`Client disconnected from stream chat=${chatId}`);
      } else {
        this.logger.error("Agent stream failed", error);
        emit("error", { detail: "Agent request failed" });
      }
    } finally {
      this.activeStreams.delete(chatId);
      raw.end();
    }
  }

  private agentHeaders() {
    return {
      "content-type": "application/json",
      ...(this.internalToken
        ? { "x-agent-internal-token": this.internalToken }
        : {}),
    };
  }

  private async askAgent(body: {
    businessId: string;
    chatId: string;
    messages: AgentMessage[];
  }) {
    const url = new URL("agent/chat", this.baseUrl);
    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: this.agentHeaders(),
        body: JSON.stringify(body),
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

  private async cleanupAgentWorkspace(
    businessId: string,
    chatId: string,
    failOnError: boolean,
  ): Promise<void> {
    const url = new URL(
      `agent/chats/${encodeURIComponent(chatId)}/runtime`,
      this.baseUrl,
    );
    let response: Response;
    try {
      response = await fetch(url, {
        method: "DELETE",
        headers: this.agentHeaders(),
        body: JSON.stringify({ businessId }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      this.logger.error(`Agent workspace cleanup failed: ${url}`, error);
      if (failOnError) {
        throw new BadGatewayException("Agent workspace is unavailable");
      }
      return;
    }
    if (response.ok) return;
    const detail = (await response.text()).slice(0, 500);
    this.logger.error(
      `Agent workspace cleanup returned ${response.status}: ${detail}`,
    );
    if (failOnError) {
      throw new BadGatewayException("Agent workspace cleanup failed");
    }
  }
}

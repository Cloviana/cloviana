import { Readable } from "node:stream";
import { Public } from "@/platform/auth/decorators/public.decorator";
import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { ModelGateway } from "../../application/ports/model-gateway.port";

@Controller("internal/agent-model")
export class ModelProxyController {
  constructor(private readonly gateway: ModelGateway) {}
  @Public()
  @Post(":runId/chat/completions")
  async completion(
    @Param("runId", ParseUUIDPipe) runId: string,
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
    @Res() reply: FastifyReply,
  ) {
    const controller = new AbortController();
    const closed = () => controller.abort();
    reply.raw.once("close", closed);
    try {
      const result = await this.gateway.forward(
        runId,
        authorization?.startsWith("Bearer ") ? authorization.slice(7) : "",
        body,
        controller.signal,
      );
      return reply
        .header("Content-Type", result.contentType)
        .header("Cache-Control", "no-store")
        .header("X-Accel-Buffering", "no")
        .send(
          Readable.fromWeb(
            result.body as import("node:stream/web").ReadableStream,
          ),
        );
    } catch (error) {
      reply.raw.off("close", closed);
      throw error;
    }
  }
}

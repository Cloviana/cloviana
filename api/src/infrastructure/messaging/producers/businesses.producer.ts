import type {
  CleanupStaleBusinessesPayload,
  RunBusinessInitializationPayload,
  RunPromptGenerationPayload,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import {
  BUSINESSES_QUEUE,
  CLEANUP_STALE_BUSINESSES_EVENT,
  RUN_BUSINESS_INITIALIZATION_EVENT,
  RUN_PROMPT_GENERATION_EVENT,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BusinessesProducer {
  constructor(
    @Inject(BUSINESSES_QUEUE.clientToken)
    private readonly client: ClientProxy,
  ) {}

  async cleanupStaleBusinesses(
    payload: CleanupStaleBusinessesPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.client.emit(CLEANUP_STALE_BUSINESSES_EVENT, payload),
    );
  }

  async runBusinessInitialization(
    payload: RunBusinessInitializationPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.client.emit(RUN_BUSINESS_INITIALIZATION_EVENT, payload),
    );
  }

  async runPromptGeneration(
    payload: RunPromptGenerationPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.client.emit(RUN_PROMPT_GENERATION_EVENT, payload),
    );
  }
}

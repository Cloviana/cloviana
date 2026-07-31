import { createRabbitMqClientProvider } from "@/infrastructure/rabbitmq/rabbitmq-client.provider";
import { Module } from "@nestjs/common";
import { AuditsProducer } from "./audits.producer";
import { AUDITS_QUEUE } from "./audits.queue";

const AuditsRabbitMqClientProvider = createRabbitMqClientProvider(AUDITS_QUEUE);

@Module({
  providers: [AuditsRabbitMqClientProvider, AuditsProducer],
  exports: [AuditsProducer],
})
export class AuditsQueueModule {}

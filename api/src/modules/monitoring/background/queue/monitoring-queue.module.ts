import { createRabbitMqClientProvider } from "@/infrastructure/rabbitmq/rabbitmq-client.provider";
import { Module } from "@nestjs/common";
import { MonitoringProducer } from "./monitoring.producer";
import { MONITORING_QUEUE } from "./monitoring.queue";

const monitoringRabbitMqClientProvider =
  createRabbitMqClientProvider(MONITORING_QUEUE);

@Module({
  providers: [monitoringRabbitMqClientProvider, MonitoringProducer],
  exports: [MonitoringProducer],
})
export class MonitoringQueueModule {}

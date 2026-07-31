import "dotenv/config";
import { createRabbitMqOptions } from "@/infrastructure/rabbitmq/rabbitmq.options";
import { AUDITS_QUEUE } from "@/modules/audits/background/queue/audits.queue";
import { KNOWLEDGE_QUEUE } from "@/modules/knowledge/background/queue/knowledge.queue";
import { MONITORING_QUEUE } from "@/modules/monitoring/background/queue/monitoring.queue";
import { WorkerModule } from "@/worker.module";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";

const DEFAULT_RABBITMQ_URI = "amqp://guest:guest@rabbitmq:5672";

async function bootstrap() {
  const rabbitmqUri = process.env.RABBITMQ_URI ?? DEFAULT_RABBITMQ_URI;
  const logger = new Logger("NestWorker", { timestamp: true });

  const app = await NestFactory.create(WorkerModule, new FastifyAdapter());

  app.connectMicroservice(createRabbitMqOptions(rabbitmqUri, AUDITS_QUEUE));
  app.connectMicroservice(createRabbitMqOptions(rabbitmqUri, MONITORING_QUEUE));
  app.connectMicroservice(createRabbitMqOptions(rabbitmqUri, KNOWLEDGE_QUEUE));

  await app.startAllMicroservices();
  await app.init();

  logger.log(`Listening for ${AUDITS_QUEUE.queue}`);
  logger.log(`Listening for ${MONITORING_QUEUE.queue}`);
  logger.log(`Listening for ${KNOWLEDGE_QUEUE.queue}`);
}

bootstrap();

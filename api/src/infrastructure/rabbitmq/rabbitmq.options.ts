import type { RmqOptions } from "@nestjs/microservices";
import { Transport } from "@nestjs/microservices";

export interface RabbitMqQueueDefinition {
  readonly clientToken: string;
  readonly queue: string;
  readonly prefetchCount?: number;
  readonly noAck?: boolean;
  readonly queueOptions: {
    readonly durable: boolean;
    readonly autoDelete: boolean;
  };
}

export function createRabbitMqOptions(
  rabbitmqUri: string,
  definition: RabbitMqQueueDefinition,
): RmqOptions {
  const options: RmqOptions["options"] = {
    urls: [rabbitmqUri],
    queue: definition.queue,
    queueOptions: definition.queueOptions,
    socketOptions: { heartbeatIntervalInSeconds: 60 },
  };

  if (definition.prefetchCount !== undefined) {
    options.prefetchCount = definition.prefetchCount;
  }

  if (definition.noAck !== undefined) {
    options.noAck = definition.noAck;
  }

  return { transport: Transport.RMQ, options };
}

export function createRabbitMqClientOptions(
  rabbitmqUri: string,
  definition: RabbitMqQueueDefinition,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUri],
      queue: definition.queue,
      queueOptions: definition.queueOptions,
    },
  };
}

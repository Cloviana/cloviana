import { AppConfiguration } from "@/config/app.configuration";
import type { Provider } from "@nestjs/common";
import { ClientProxyFactory } from "@nestjs/microservices";
import type { RabbitMqQueueDefinition } from "./rabbitmq.options";
import { createRabbitMqClientOptions } from "./rabbitmq.options";

export function createRabbitMqClientProvider(
  definition: RabbitMqQueueDefinition,
): Provider {
  return {
    provide: definition.clientToken,
    useFactory: (config: AppConfiguration) =>
      ClientProxyFactory.create(
        createRabbitMqClientOptions(config.rabbitmqUri, definition),
      ),
    inject: [AppConfiguration],
  };
}

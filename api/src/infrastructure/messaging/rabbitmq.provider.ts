import { AppConfiguration } from "@/config/app.configuration";
import { Provider } from "@nestjs/common";
import { ClientProxy, ClientProxyFactory } from "@nestjs/microservices";
import {
  AUDITS_QUEUE,
  BLOG_QUEUE,
  BUSINESSES_QUEUE,
  KNOWLEDGE_QUEUE,
  MONITORING_QUEUE,
  createRabbitMqClientOptions,
} from "./rabbitmq.contracts";

export const RabbitMqProviders: Provider[] = [
  {
    provide: AUDITS_QUEUE.clientToken,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create(
        createRabbitMqClientOptions(cfg.rabbitmqUri, AUDITS_QUEUE),
      );
    },
    inject: [AppConfiguration],
  },
  {
    provide: BUSINESSES_QUEUE.clientToken,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create(
        createRabbitMqClientOptions(cfg.rabbitmqUri, BUSINESSES_QUEUE),
      );
    },
    inject: [AppConfiguration],
  },
  {
    provide: MONITORING_QUEUE.clientToken,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create(
        createRabbitMqClientOptions(cfg.rabbitmqUri, MONITORING_QUEUE),
      );
    },
    inject: [AppConfiguration],
  },
  {
    provide: BLOG_QUEUE.clientToken,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create(
        createRabbitMqClientOptions(cfg.rabbitmqUri, BLOG_QUEUE),
      );
    },
    inject: [AppConfiguration],
  },
  {
    provide: KNOWLEDGE_QUEUE.clientToken,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create(
        createRabbitMqClientOptions(cfg.rabbitmqUri, KNOWLEDGE_QUEUE),
      );
    },
    inject: [AppConfiguration],
  },
];

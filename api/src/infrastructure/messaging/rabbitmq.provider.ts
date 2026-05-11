import { AppConfiguration } from "@/config/app.configuration";
import { Provider } from "@nestjs/common";
import { ClientProxy, ClientProxyFactory } from "@nestjs/microservices";
import {
  AUDITS_QUEUE,
  BUSINESSES_QUEUE,
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
];

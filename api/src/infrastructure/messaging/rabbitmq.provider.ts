import { AppConfiguration } from "@/config/app.configuration";
import {
  AUDITS_CLIENT,
  AUDITS_QUEUE,
  AUDITS_QUEUE_OPTS,
  BLOGS_CLIENT,
  BLOGS_QUEUE,
  BLOGS_QUEUE_OPTS,
  KEYWORDS_CLIENT,
  KEYWORDS_QUEUE,
  KEYWORDS_QUEUE_OPTS,
  PRODUCTS_CLIENT,
  PRODUCTS_QUEUE,
  PRODUCTS_QUEUE_OPTS,
  STORES_CLIENT,
  STORES_QUEUE,
  STORES_QUEUE_OPTS,
} from "@/constants/rabbitmq.constants";
import { Provider } from "@nestjs/common";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";

export const RabbitMqProviders: Provider[] = [
  {
    provide: KEYWORDS_CLIENT,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [cfg.rabbitmqUri],
          queue: KEYWORDS_QUEUE,
          queueOptions: KEYWORDS_QUEUE_OPTS,
        },
      });
    },
    inject: [AppConfiguration],
  },
  {
    provide: BLOGS_CLIENT,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [cfg.rabbitmqUri],
          queue: BLOGS_QUEUE,
          queueOptions: BLOGS_QUEUE_OPTS,
        },
      });
    },
    inject: [AppConfiguration],
  },
  {
    provide: STORES_CLIENT,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [cfg.rabbitmqUri],
          queue: STORES_QUEUE,
          queueOptions: STORES_QUEUE_OPTS,
        },
      });
    },
    inject: [AppConfiguration],
  },
  {
    provide: PRODUCTS_CLIENT,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [cfg.rabbitmqUri],
          queue: PRODUCTS_QUEUE,
          queueOptions: PRODUCTS_QUEUE_OPTS,
        },
      });
    },
    inject: [AppConfiguration],
  },
  {
    provide: AUDITS_CLIENT,
    useFactory: (cfg: AppConfiguration): ClientProxy => {
      return ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [cfg.rabbitmqUri],
          queue: AUDITS_QUEUE,
          queueOptions: AUDITS_QUEUE_OPTS,
        },
      });
    },
    inject: [AppConfiguration],
  },
];

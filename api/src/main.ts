import fastifyCookie from "@fastify/cookie";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { RmqOptions, Transport } from "@nestjs/microservices";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "@/app.module";
import { AppConfiguration } from "@/common/config/app.configuration";
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";
import {
  AUDITS_QUEUE,
  AUDITS_QUEUE_OPTS,
  BLOGS_QUEUE,
  BLOGS_QUEUE_OPTS,
  KEYWORDS_QUEUE,
  KEYWORDS_QUEUE_OPTS,
  PRODUCTS_QUEUE,
  PRODUCTS_QUEUE_OPTS,
  STORES_QUEUE,
  STORES_QUEUE_OPTS,
} from "@/constants/rabbitmq.constants";
import { SupabaseAuthGuard } from "./modules/auth/guards/supabase-auth.guards";

async function bootstrap() {
  const adapter = new FastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { rawBody: true },
  );
  await app.register(fastifyCookie);

  // Global API prefix and auth guard
  app.setGlobalPrefix("api");
  app.useGlobalGuards(app.get(SupabaseAuthGuard));

  const logger = new Logger("NestApplication", { timestamp: true });
  const { port, host, rabbitmqUri } = app.get(AppConfiguration);

  // --- RabbitMQ Consumer Setup ---
  const queues = [
    { name: KEYWORDS_QUEUE, opts: KEYWORDS_QUEUE_OPTS },
    { name: BLOGS_QUEUE, opts: BLOGS_QUEUE_OPTS },
    { name: STORES_QUEUE, opts: STORES_QUEUE_OPTS },
    { name: PRODUCTS_QUEUE, opts: PRODUCTS_QUEUE_OPTS },
    { name: AUDITS_QUEUE, opts: AUDITS_QUEUE_OPTS },
  ];

  for (const { name, opts } of queues) {
    app.connectMicroservice<RmqOptions>({
      transport: Transport.RMQ,
      options: { urls: [rabbitmqUri], queue: name, queueOptions: opts },
    });
  }

  // Start the RMQ microservice (declares queue, binds handlers)
  await app.startAllMicroservices();

  // --- HTTP Server Configuration ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: [
      "https://cloviana.com",
      "https://www.cloviana.com",
      "https://app.cloviana.com",
      "http://localhost:3000",
      "http://app.localhost",
      "http://localhost",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });

  // Start HTTP server
  await app.listen(port, host);
  logger.log(`Listening on ${host}:${port}`);
}

bootstrap();

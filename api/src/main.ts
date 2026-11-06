import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "@/app.module";
import { PlatformAuthGuard } from "@/platform/auth/guards/platform-auth.guard";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { AllExceptionsFilter } from "@/platform/http/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 12 * 1024 * 1024 }),
  );

  // Global API prefix and auth guard
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  app.useGlobalGuards(app.get(PlatformAuthGuard));

  const logger = new Logger("NestApplication", { timestamp: true });
  const { port, host } = app.get(AppConfiguration);

  // --- HTTP Server Configuration ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const { appUrl, environment } = app.get(AppConfiguration);
  // Tenant hosts are not listed: the browser reaches the API through the app's same-origin rewrite.
  app.enableCors({
    origin: [
      appUrl,
      "https://cloviana.com",
      "https://www.cloviana.com",
      ...(environment === "development"
        ? [
            "http://localhost:3000",
            "http://localhost",
            "https://localhost",
            "http://admin.localhost",
            "https://admin.localhost",
          ]
        : []),
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });

  // Start HTTP server
  await app.listen(port, host);
  logger.log(`Listening on ${host}:${port}`);
}

bootstrap();

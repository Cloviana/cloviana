import fastifyCookie from "@fastify/cookie";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "@/app.module";
import { AppConfiguration } from "@/common/config/app.configuration";
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";
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

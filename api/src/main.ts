import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "@/app.module";
import { AppConfiguration } from "@/common/config/app.configuration";
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";
import { inngest } from "@/infrastructure/inngest/inngest.client";
import { AuditWorkflow } from "@/modules/audits/background/workflows/audit/audit.workflow";
import { ContentTypeResearchWorkflow } from "@/modules/brand-kit/background/workflows/content-type-research/content-type-research.workflow";
import { ProductResearchWorkflow } from "@/modules/brand-kit/background/workflows/product-research/product-research.workflow";
import { KnowledgeWorkflow } from "@/modules/knowledge/background/workflows/knowledge/knowledge.workflow";
import { MonitoringScheduler } from "@/modules/monitoring/background/schedulers/monitoring.scheduler";
import { MonitoringWorkflow } from "@/modules/monitoring/background/workflows/monitoring/monitoring.workflow";
import { connect } from "inngest/connect";
import { SupabaseAuthGuard } from "./modules/auth/guards/supabase-auth.guards";

async function bootstrap() {
  // Chat attachments arrive as base64 data URLs in the JSON body; the
  // Fastify default of 1MB rejects anything bigger than a small image.
  const adapter = new FastifyAdapter({ bodyLimit: 20 * 1024 * 1024 });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { rawBody: true },
  );
  await app.register(fastifyCookie);
  await app.register(fastifyMultipart, {
    limits: {
      files: 5,
      fields: 5,
      fileSize: 5 * 1024 * 1024,
      parts: 10,
    },
  });

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
      "https://app.localhost",
      "http://localhost",
      "https://localhost",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });

  // Start HTTP server
  await app.listen(port, host);
  logger.log(`Listening on ${host}:${port}`);

  const connection = await connect({
    apps: [
      {
        client: inngest,
        functions: [
          app.get(AuditWorkflow).inngestFunction,
          ...app.get(KnowledgeWorkflow).inngestFunctions,
          app.get(MonitoringScheduler).inngestFunction,
          app.get(MonitoringWorkflow).inngestFunction,
          app.get(ContentTypeResearchWorkflow).inngestFunction,
          app.get(ProductResearchWorkflow).inngestFunction,
        ],
      },
    ],
    gatewayUrl: app.get(AppConfiguration).inngestConnectGatewayUrl,
    maxWorkerConcurrency: app.get(AppConfiguration).inngestMaxWorkerConcurrency,
  });

  logger.log(
    `Connected to Inngest gateway ${app.get(AppConfiguration).inngestConnectGatewayUrl}`,
  );
  await connection.closed;
  await app.close();
}

bootstrap();

import { Configuration, Value } from "@itgorillaz/configify";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

@Configuration()
export class AppConfiguration {
  @IsNumber()
  @Value("API_PORT", { parse: (value) => Number(value || 5001) })
  readonly port: number;

  @IsString()
  @Value("API_HOST", { parse: (value) => value || "0.0.0.0" })
  readonly host: string;

  @IsString()
  @Value("APP_URL", { parse: (value) => value || "http://localhost:3000" })
  readonly appUrl: string;

  @IsString()
  @Value("API_URL", { parse: (value) => value || "http://localhost:3000" })
  readonly apiUrl: string;

  @IsString()
  @Value("ENVIRONMENT", { parse: (value) => value || "development" })
  readonly environment: "development" | "production";

  @IsString()
  @MinLength(32)
  @Value("PLATFORM_AUTH_SECRET")
  readonly platformAuthSecret!: string;

  @IsString()
  @Value("INNGEST_CONNECT_GATEWAY_URL", {
    parse: (value) => value || "ws://localhost:8289/v0/connect",
  })
  readonly inngestConnectGatewayUrl!: string;

  @IsNumber()
  @Value("INNGEST_MAX_WORKER_CONCURRENCY", {
    parse: (value) => Number(value || 12),
  })
  readonly inngestMaxWorkerConcurrency!: number;

  @IsString()
  @Value("REDIS_URL", {
    parse: (value) => value || "redis://localhost:6379",
  })
  readonly redisUrl!: string;

  // Base domain for marketplace subdomains: <slug>.<PLATFORM_BASE_DOMAIN>.
  @IsString()
  @Value("PLATFORM_BASE_DOMAIN", { parse: (value) => value || "localhost" })
  readonly platformBaseDomain: string;

  // Public origin of the API that hosts shared auth callbacks (e.g. https://auth.cloviana.com).
  @IsString()
  @Value("MARKETPLACE_AUTH_URL", {
    parse: (value) => value || "http://localhost:5001",
  })
  readonly marketplaceAuthUrl: string;

  @IsString()
  @MinLength(32)
  @Value("MARKETPLACE_AUTH_SECRET")
  readonly marketplaceAuthSecret!: string;

  @IsString()
  @Value("MARKETPLACE_AUTH_EMAIL_FROM", {
    parse: (value) => value || "Cloviana <no-reply@cloviana.com>",
  })
  readonly marketplaceAuthEmailFrom: string;

  @IsOptional()
  @IsString()
  @Value("GOOGLE_CLIENT_ID")
  readonly googleClientId?: string;

  @IsOptional()
  @IsString()
  @Value("GOOGLE_CLIENT_SECRET")
  readonly googleClientSecret?: string;

  @IsOptional()
  @IsString()
  @Value("RESEND_API_KEY")
  readonly resendApiKey?: string;

  @IsOptional()
  @IsString()
  @Value("EXA_API_KEY")
  readonly exaApiKey?: string;

  @IsOptional()
  @IsString()
  @Value("OPENROUTER_API_KEY")
  readonly openrouterApiKey?: string;

  @IsOptional()
  @IsString()
  @Value("R2_ENDPOINT")
  readonly r2Endpoint?: string;

  @IsOptional()
  @IsString()
  @Value("R2_BUCKET")
  readonly r2Bucket?: string;

  @IsOptional()
  @IsString()
  @Value("R2_ACCESS_KEY_ID")
  readonly r2AccessKeyId?: string;

  @IsOptional()
  @IsString()
  @Value("R2_SECRET_ACCESS_KEY")
  readonly r2SecretAccessKey?: string;

  @IsOptional()
  @IsString()
  @Value("R2_PUBLIC_BASE_URL")
  readonly r2PublicBaseUrl?: string;

  // Never served publicly: theme code snapshots and starter templates.
  @IsOptional()
  @IsString()
  @Value("R2_PRIVATE_BUCKET")
  readonly r2PrivateBucket?: string;

  @IsOptional()
  @IsString()
  @Value("DAYTONA_API_KEY")
  readonly daytonaApiKey?: string;

  @IsOptional()
  @IsString()
  @Value("DAYTONA_API_URL")
  readonly daytonaApiUrl?: string;

  @IsOptional()
  @IsString()
  @Value("DAYTONA_TARGET", { parse: (value) => value || "eu" })
  readonly daytonaTarget?: string;

  @IsOptional()
  @IsString()
  @Value("DAYTONA_SNAPSHOT")
  readonly daytonaSnapshot?: string;

  @IsString()
  @Value("AGENT_MODEL", {
    parse: (value) => value || "anthropic/claude-sonnet-4.6",
  })
  readonly agentModel!: string;

  @IsString()
  @Value("CODING_AGENT_MODEL", {
    parse: (value) => value || "anthropic/claude-sonnet-4.6",
  })
  readonly codingAgentModel!: string;

  // Off sends every undo through a full sandbox rebuild.
  @Value("THEME_IN_PLACE_REVERT", { parse: (value) => value !== "false" })
  readonly themeInPlaceRevert!: boolean;

  @IsOptional()
  @IsString()
  @Value("AGENT_MODEL_PROXY_URL")
  readonly agentModelProxyUrl?: string;

  @IsString()
  @IsIn(["daytona", "docker"])
  @Value("SANDBOX_PROVIDER", {
    parse: (value) =>
      value ||
      (process.env.ENVIRONMENT === "production" ? "daytona" : "docker"),
  })
  readonly sandboxProvider!: string;

  @IsNumber()
  @Value("AGENT_WORKER_CONCURRENCY", { parse: (value) => Number(value || 2) })
  readonly agentWorkerConcurrency!: number;
}

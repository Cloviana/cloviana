import { Configuration, Value } from "@itgorillaz/configify";
import { IsFQDN, IsNumber, IsString } from "class-validator";

@Configuration()
export class AppConfiguration {
  @IsNumber()
  @Value("API_PORT", { parse: (value) => Number(value || 5000) })
  readonly port: number;

  @IsString()
  @Value("API_HOST", { parse: (value) => value || "localhost" })
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
  @Value("SUPABASE_JWT_SECRET")
  readonly supabaseJwtSecret!: string;

  @IsString()
  @Value("SUPABASE_SERVICE_ROLE_KEY")
  readonly supabaseServiceRoleKey!: string;

  @IsString()
  @Value("SUPABASE_ANON_KEY")
  readonly supabaseAnonKey!: string;

  @IsString()
  @Value("SUPABASE_URL")
  readonly supabaseUrl!: string;

  @IsString()
  @Value("STRIPE_SECRET_KEY")
  readonly stripeSecretKey!: string;

  @IsString()
  @Value("STRIPE_WEBHOOK_SECRET")
  readonly stripeWebhookSecret!: string;

  @IsString()
  @Value("RABBITMQ_URI", {
    parse: (value) => value || "amqp://guest:guest@rabbitmq:5672",
  })
  readonly rabbitmqUri!: string;

  @IsString()
  @Value("REDIS_URL", {
    parse: (value) => value || "redis://redis:6379",
  })
  readonly redisUrl!: string;

  @IsString()
  @Value("SERANKING_API_KEY")
  readonly serankingApiKey!: string;

  @IsString()
  @Value("SMTP2GO_API_KEY")
  readonly smtp2goApiKey!: string;

  @IsString()
  @Value("SMTP2GO_DEFAULT_FROM")
  readonly smtp2goDefaultFrom!: string;

  @IsString()
  @Value("GOOGLE_API_KEY")
  readonly googleApiKey!: string;

  @IsString()
  @Value("GOOGLE_CX")
  readonly googleCx!: string;

  @IsString()
  @Value("AZURE_CDN_ENDPOINT")
  readonly azureCdnEndpoint!: string;

  @IsString()
  @Value("AZURE_STORAGE_CONNECTION_STRING")
  readonly azureStorageConnectionString!: string;

  @IsString()
  @Value("IDEOGRAM_API_KEY")
  readonly ideogramApiKey!: string;

  @IsString()
  @Value("SHOPIFY_API_KEY")
  readonly shopifyApiKey!: string;

  @IsString()
  @Value("SHOPIFY_API_SECRET")
  readonly shopifyApiSecret!: string;

  @IsFQDN({ require_tld: false })
  @Value("SHOPIFY_HOST")
  readonly shopifyHost!: string;
}

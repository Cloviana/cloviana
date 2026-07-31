import { Configuration, Value } from "@itgorillaz/configify";
import { IsNumber, IsString } from "class-validator";

@Configuration()
export class AppConfiguration {
  @IsNumber()
  @Value("API_PORT", { parse: (value) => Number(value || 5000) })
  readonly port: number;

  @IsString()
  @Value("API_HOST", { parse: (value) => value || "0.0.0.0" })
  readonly host: string;

  @IsString()
  @Value("APP_URL", { parse: (value) => value || "http://localhost:3000" })
  readonly appUrl: string;

  // Marketing site as reachable from inside the cluster, not its public URL —
  // container-to-container only (the headless PDF renderer). For a link a human
  // will open (emails, canonical URLs), use the public site URL instead.
  @IsString()
  @Value("WEB_INTERNAL_URL", { parse: (value) => value || "http://web:3000" })
  readonly webInternalUrl: string;

  @IsString()
  @Value("API_URL", { parse: (value) => value || "http://localhost:3000" })
  readonly apiUrl: string;

  @IsString()
  @Value("KNOWLEDGE_BASE_URL", {
    parse: (value) => value || "http://localhost:8080",
  })
  readonly knowledgeBaseUrl: string;

  @IsString()
  @Value("KNOWLEDGE_UPLOADS_DIR", {
    parse: (value) => value || "/data/knowledge-uploads",
  })
  readonly knowledgeUploadsDir: string;

  @IsString()
  @Value("AGENT_URL", {
    parse: (value) => value || "http://localhost:8000",
  })
  readonly agentUrl: string;

  @IsString()
  @Value("AGENT_INTERNAL_TOKEN", { parse: (value) => value || "" })
  readonly agentInternalToken: string;

  @IsString()
  @Value("ENVIRONMENT", { parse: (value) => value || "development" })
  readonly environment: "development" | "production";

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
  @Value("STRIPE_API_KEY")
  readonly stripeApiKey!: string;

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
  @Value("DATA_FOR_SEO_BASE64_CREDENTIALS")
  readonly dataForSeoBase64Credentials!: string;

  @IsString()
  @Value("ANTHROPIC_API_KEY")
  readonly anthropicApiKey!: string;

  @IsString()
  @Value("GROQ_API_KEY")
  readonly groqApiKey!: string;

  @IsString()
  @Value("RESEND_API_KEY")
  readonly resendApiKey!: string;

  @IsString()
  @Value("EXA_API_KEY")
  readonly exaApiKey!: string;

  @IsString()
  @Value("OPENAI_API_KEY")
  readonly openaiApiKey!: string;
}

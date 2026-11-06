import { OPENCODE_VERSION } from "@/integrations/opencode/opencode.constants";
import { SANDBOX_NODE_IMAGE } from "@/integrations/sandbox/sandbox.constants";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { DependencyUnavailableError } from "@/shared/errors/application-error";
import { Daytona, Image } from "@daytona/sdk";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DaytonaService {
  private client?: Daytona;
  constructor(private readonly config: AppConfiguration) {}

  connection() {
    if (!this.config.daytonaApiKey) {
      throw new DependencyUnavailableError("Daytona is not configured");
    }
    this.client ??= new Daytona({
      apiKey: this.config.daytonaApiKey,
      apiUrl: this.config.daytonaApiUrl,
      target: this.config.daytonaTarget,
    });
    return this.client;
  }

  async create(name: string) {
    const client = this.connection();
    // A deterministic name lets a retried worker recover a sandbox created before a crash.
    try {
      return await client.get(name);
    } catch (error) {
      if (!this.notFound(error)) {
        throw error;
      }
    }
    const base = {
      name,
      public: false,
      autoStopInterval: 30,
      autoDeleteInterval: 1440,
      labels: { application: "cloviana", workspace: name },
    };
    return this.config.daytonaSnapshot
      ? client.create(
          { ...base, snapshot: this.config.daytonaSnapshot },
          { timeout: 180 },
        )
      : client.create(
          {
            ...base,
            image: Image.base(SANDBOX_NODE_IMAGE).runCommands(
              "apt-get update && apt-get install -y --no-install-recommends git python3 curl && rm -rf /var/lib/apt/lists/*",
              `npm install -g opencode-ai@${OPENCODE_VERSION}`,
            ),
            resources: { cpu: 2, memory: 4, disk: 10 },
          },
          { timeout: 180 },
        );
  }

  get(id: string) {
    return this.connection().get(id);
  }

  async remove(id: string) {
    try {
      await this.connection().delete(await this.get(id));
    } catch (error) {
      if (!this.notFound(error)) {
        throw error;
      }
    }
  }

  private notFound(error: unknown) {
    const e = error as {
      statusCode?: number;
      status?: number;
      response?: { status?: number };
    };
    return (
      e?.statusCode === 404 || e?.status === 404 || e?.response?.status === 404
    );
  }
}

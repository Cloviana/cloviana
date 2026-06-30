import { AppConfiguration } from "@/common/config/app.configuration";
import { createClient } from "@keyv/redis";
import {
  HttpException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";

const WINDOW_SECONDS = 60;
const USER_REQUESTS_PER_MINUTE = 10;
const BUSINESS_REQUESTS_PER_MINUTE = 30;
const REQUEST_TIMEOUT_SECONDS = 150;

const INCREMENT_WITH_EXPIRY = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

@Injectable()
export class ChatRateLimiter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatRateLimiter.name);
  private readonly client: ReturnType<typeof createClient>;

  constructor(config: AppConfiguration) {
    this.client = createClient({ url: config.redisUrl });
    this.client.on("error", (error) =>
      this.logger.error("Redis rate limiter error", error),
    );
  }

  async onModuleInit() {
    if (!this.client.isOpen) await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client.isOpen) await this.client.quit();
  }

  async acquire(userId: string, businessId: string) {
    try {
      const [userCount, businessCount] = await Promise.all([
        this.increment(`chat:rate:user:${userId}`),
        this.increment(`chat:rate:business:${businessId}`),
      ]);

      if (
        userCount > USER_REQUESTS_PER_MINUTE ||
        businessCount > BUSINESS_REQUESTS_PER_MINUTE
      ) {
        throw new HttpException(
          {
            message: "Chat rate limit exceeded",
            retryAfterSeconds: WINDOW_SECONDS,
          },
          429,
        );
      }

      const lockKey = `chat:active:user:${userId}`;
      const locked = await this.client.set(lockKey, "1", {
        EX: REQUEST_TIMEOUT_SECONDS,
        NX: true,
      });
      if (!locked) {
        throw new HttpException(
          { message: "A chat request is already in progress" },
          429,
        );
      }

      return async () => {
        try {
          await this.client.del(lockKey);
        } catch (error) {
          this.logger.error("Failed to release chat rate-limit lock", error);
        }
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error("Chat rate limiter is unavailable", error);
      throw new ServiceUnavailableException("Chat is temporarily unavailable");
    }
  }

  private async increment(key: string) {
    return Number(
      await this.client.eval(INCREMENT_WITH_EXPIRY, {
        keys: [key],
        arguments: [String(WINDOW_SECONDS)],
      }),
    );
  }
}

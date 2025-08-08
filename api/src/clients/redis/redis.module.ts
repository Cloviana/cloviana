import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
import { AppConfiguration } from "@/config/app.configuration";

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [AppConfiguration],
      useFactory: async (config: AppConfiguration) => ({
        store: await redisStore({
          url: config.redisUrl,
        }),
      }),
    }),
  ],
})
export class RedisModule {}

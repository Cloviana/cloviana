import { AppConfiguration } from "@/platform/config/app.configuration";
import KeyvRedis from "@keyv/redis";
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [AppConfiguration],
      useFactory: async (config: AppConfiguration) => ({
        stores: [new KeyvRedis(config.redisUrl)],
      }),
    }),
  ],
})
export class RedisModule {}

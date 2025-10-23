import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import KeyvRedis from "@keyv/redis";
import { AppConfiguration } from "@/config/app.configuration";

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

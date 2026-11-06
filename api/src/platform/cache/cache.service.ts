import { createHash } from "node:crypto";
import { CACHE_MANAGER, type Cache } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class AppCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  buildKey(scope: string, input: unknown, version = "v1"): string {
    return `app:${version}:${scope}:${this.hash(input)}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return (await this.cache.get<T>(key)) ?? null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async remember<T>({
    key,
    ttl,
    loader,
  }: {
    key: string;
    ttl: number;
    loader: () => Promise<T>;
  }): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await loader();
    await this.set(key, value, ttl);
    return value;
  }

  private hash(input: unknown): string {
    return createHash("sha256")
      .update(typeof input === "string" ? input : JSON.stringify(input))
      .digest("hex")
      .slice(0, 12);
  }
}

import { ApiXCache, ApiXCacheValue } from "./ApiXCache";
import { RedisClientType, createClient } from 'redis';

/**
 * An implementation of a Redis store.
 * 
 * @category Working with Caches
 * @beta
 */
export class ApiXRedisStore implements ApiXCache {
  private client: RedisClientType;

  /**
   * Create an instance of a Redis cache.
   * @param url The URL for the redis cache. Defaults to `redis://localhost:6379`.
   * @param password An optional password (if protected).
   */
  constructor(url = 'redis://localhost:6379', password?: string) {
    this.client = createClient({ url: url, password });
  }

  /**
   * Connects to the Redis server.
   */
  async connect() {
    await this.client.connect();
  }

  async setValueForKey(value: ApiXCacheValue, key: string, timeToLive?: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
    if (timeToLive) {
      await this.client.expire(key, timeToLive);
    }
  }

  async removeValueForKey(key: string): Promise<void> {
    await this.client.del(key);
  }

  async valueForKey(key: string): Promise<ApiXCacheValue | undefined> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : undefined;
  }
}

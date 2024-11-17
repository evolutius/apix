import {ApiXRedisStore} from '../ApiXRedisStore';

const map: Map<string, string> = new Map();

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockRejectedValue({
      catch: jest.fn()
    }),
    set: jest.fn().mockImplementation(async (key: string, value: string) => {
      map.set(key, value);
      await Promise.resolve();
    }),
    del: jest.fn().mockImplementation(async (key: string) => {
      map.delete(key);
      await Promise.resolve();
    }),
    get: jest.fn().mockImplementation(async (key: string) => {
      return Promise.resolve(map.get(key));
    }),
    expire: jest.fn()
  })
}));

describe('ApiXRedisStore', () => {
  test('values are correctly stored and retrievable from cache', async () => {
    const cache = new ApiXRedisStore();
    const value = 9504;
    const key = "9504";
    expect(await cache.valueForKey(key)).toBeUndefined();
    await cache.setValueForKey(value, key);
    expect(await cache.valueForKey(key)).toBe(value);
  });

  test('values not stored in the cache are undefined', async () => {
    const cache = new ApiXRedisStore();
    const key = "95042";
    expect(await cache.valueForKey(key)).toBeUndefined();
  });

  test('values removed from the cache are undefined', async () => {
    const cache = new ApiXRedisStore();
    const key = "9505";
    const value = 9505;
    expect(await cache.valueForKey(key)).toBeUndefined();
    await cache.setValueForKey(value, key, 1);
    expect(await cache.valueForKey(key)).toBe(value);
    await cache.removeValueForKey(key);
    expect(await cache.valueForKey(key)).toBeUndefined();
  });
});
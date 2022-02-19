import {ApiXConfig} from '../../ApiXConfig';
import {ApiXMemoryStore} from '../ApiXCache';

describe('ApiXMemoryStore', () => {
  const appConfig = new ApiXConfig();
  test('Values are correctly stored and retrievable from cache', () => {
    const cache = new ApiXMemoryStore(appConfig);
    const value = 9504;
    const key = "9504";
    cache.setValueForKey(value, key);
    expect(cache.valueForKey(key)).toBe(value);
  });

  test('Values not stored in the cache are undefined', () => {
    const cache = new ApiXMemoryStore(appConfig);
    const key = "9504";
    expect(cache.valueForKey(key)).toBeUndefined();
  });

  appConfig.setValueForKey(500, 'maxRequestDateDifference');
  const evictionTime = appConfig.valueForKey('maxRequestDateDifference') as number;
  jest.setTimeout(evictionTime + 1000);
  test('Values are evicted from cache', async () => {
    const cache = new ApiXMemoryStore(appConfig);
    const value = 9504;
    const key = "9504";
    cache.setValueForKey(value, key);
    await new Promise((r) => setTimeout(r, evictionTime));
    expect(cache.valueForKey(key)).toBeUndefined();
  });
});
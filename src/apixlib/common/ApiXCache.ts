/**
 * A value for a cache.
 * 
 * @category Working with Caches
 */
export declare type ApiXCacheValue = 
  string
  | number
  | bigint
  | boolean
  | Array<ApiXCacheValue>
  | Map<string, ApiXCacheValue>
  | Record<string, unknown>

/**
 * This is the interface to implement to add a Cache to the ApiXManager.
 * This interface requires at least support for a key-value store.
 * If a class implements this interface and it is provided to the ApiXManager,
 * the ApiX will have enhanced security and faster operation.
 * 
 * @category Working with Caches
 */
export interface ApiXCache {
  /**
   * Sets a value from the key in the key-value pair store.
   * @param {ApiXCacheValue} value - The value to add to the store
   * @param {string} key - The key in the store
   * @param {number} timeToLive - Time to remove from cache
   */
  setValueForKey(value: ApiXCacheValue, key: string, timeToLive?: number): void

  /**
   * Removes the value for the specified key. If the key
   * does not exist, the method gracefully fails.
   * @param {string} key - The key in the store
   */
  removeValueForKey(key: string): void

  /**
   * Gets the value from the key-value pair store.
   * @param {string} key - The key in the store
   * @return value, if it exists in the store
   */
  valueForKey(key: string): ApiXCacheValue | undefined | Promise<ApiXCacheValue | undefined>
}

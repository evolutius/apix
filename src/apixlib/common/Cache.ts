/**
 * A value for a cache.
 * 
 * @category Working with Caches
 */
export declare type CacheValue = 
  string
  | number
  | bigint
  | boolean
  | Array<CacheValue>
  | Map<string, CacheValue>
  | Record<string, unknown>

/**
 * This is the interface to implement to add a Cache to the `AppManager`.
 * This interface requires at least support for a key-value store.
 * If a class implements this interface and it is provided to the `AppManager`,
 * the API-X endpoints will have enhanced security and faster operation.
 * 
 * @category Working with Caches
 */
export interface Cache {
  /**
   * Sets a value from the key in the key-value pair store.
   * @param {CacheValue} value - The value to add to the store
   * @param {string} key - The key in the store
   * @param {number} timeToLive - Time to remove from cache
   */
  setValueForKey(value: CacheValue, key: string, timeToLive?: number): void

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
  valueForKey(key: string): CacheValue | undefined | Promise<CacheValue | undefined>
}

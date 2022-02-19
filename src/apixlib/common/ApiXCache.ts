import {ApiXConfig} from "../ApiXConfig";

/**
 * This is the interface to implement to add a Cache to the ApiXManager.
 * This interface requires at least support for a key-value store.
 * If a class implements this interface and it is provided to the ApiXManager,
 *  the ApiX will have enhanced security and faster operation.
 */
export interface ApiXCache {
    /**
     * Sets a value from the key in the key-value pair store
     * @param {string} value - The value to add to the store
     * @param {string} key - The key in the store
     */
    setValueForKey(value: unknown, key: string): void

    /**
     * Gets the value from the key-value pair store
     * @param {string} key - The key in the store
     * @return value, if it exists 
     */
    valueForKey(key: string): unknown
}

/**
 * This is the default class that implements an ApiXCache.
 * This cache stores in memory, and as such is well-suited for
 * small applications where not a lot of information will be
 * requested.
 * This cache evicts after X time has passed, and the time
 * is determined by the 'max_req_date_diff' in the ApiXConfig
 * 
 * @constructor - Requires the ApiXConfig. This must be the same
 * ApiXConfig that is used in the ApiXManager. If a different
 * instance is used, it might cause discrepancies in the data.
 */
export class ApiXMemoryStore implements ApiXCache {
  private cache: {[key: string]: unknown};
  private appConfig: ApiXConfig;

  public constructor(appConfig: ApiXConfig) {
    this.cache = {};
    this.appConfig = appConfig;
  }

  /**
   * Sets a value from the key in the key-value pair store
   * @param {string} value - The value to add to the store
   * @param {string} key - The key in the store
   */
  public setValueForKey(value: unknown, key: string): void {
    this.cache[key] = value;
    this.scheduleEvictionForValueInKey(value, key);
  }

  /**
   * Gets the value from the key-value pair store
   * @param {string} key - The key in the store
   * @return value, if it exists 
   */
  public valueForKey(key: string): unknown {
    return this.cache[key];
  }

  private scheduleEvictionForValueInKey(value: unknown, key: string) {
    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      setTimeout(() => {
        self.cache[key] = undefined;
      }, this.appConfig.valueForKey('maxRequestDateDifference') as number);
    }
  }
}

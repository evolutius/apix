import fs from 'fs';

type ApiXConfigDictionary = Record<string, unknown>;

/**
 * API-X Configuration Keys.
 * 
 * @category API Configuration
 * 
 * @enum
 */
export const enum ApiXConfigKey {
  /**
   * Determines the maximum difference in a date that is
   * tolerated before a request is considered invalid. Defaults to
   * `60000` milliseconds / 1 minute.
   */
  MaxRequestAge = 'maxRequestAge',

  /**
   * The port that the API-X listens on.
   */
  Port = 'port',

  /**
   * The host that the API-X binds to.
   */
  Host = 'host'
}

/**
 * An object that represents the configuration of the API.
 * By default, configuration files are expected to be named `apix.config.json`.
 * 
 * A typical config file will look like this:
 * ```json
 * {
 *   "host": "127.0.0.1",
 *   "port": 3000,
 *   "maxRequestAge": 60000
 * }
 * ```
 * 
 * @category API Configuration
 */
export class ApiXConfig {
  private config: ApiXConfigDictionary;

  /**
   * Creates a new configuration object.
   * @param {string} configFile The path to the configuration file.
   * Defaults to `apix.config.json`.
   */
  constructor(configFile = 'apix.config.json') {
    try {
      const data = fs.readFileSync(configFile, 'utf-8');
      this.config = JSON.parse(data);

      if (this.valueForKey(ApiXConfigKey.MaxRequestAge) === undefined) {
        this.setValueForKey(60000, ApiXConfigKey.MaxRequestAge);
      }

      if (this.valueForKey(ApiXConfigKey.Port) === undefined) {
        this.setValueForKey(3000, ApiXConfigKey.Port);
      }

      if (this.valueForKey(ApiXConfigKey.Host) === undefined) {
        this.setValueForKey('127.0.0.1', ApiXConfigKey.Port);
      }
    } catch {
      this.config = {
        [ApiXConfigKey.MaxRequestAge]: 60000,
        [ApiXConfigKey.Port]: 3000,
        [ApiXConfigKey.Host]: '127.0.0.1',
      };
    }
  }

  /**
   * Retrieves a value for a key.
   * @param {string} key key in config.
   * @returns {T} value for provided key.
   * 
   * @example
   * ```ts
   * const port = config.valueForKey<number>(ApiXConfigKey.Port) || 3000;
   * ```
   */
  public valueForKey<T>(key: string): T | undefined {
    return this.config[key] as T;
  }

  /**
   * Retrieves a value for a key.
   * @param {T} value the value to set for the key.
   * @param {string} key key in config.
   */
  public setValueForKey<T>(value: T, key: string) {
    this.config[key] = value;
  }
}

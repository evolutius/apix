import fs from 'fs';

type ApiXConfigDictionary = Record<string, unknown>;

/**
 * API-X Configuration Keys.
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
  Port = 'port'
}

/**
 * App Configuration Data
 */
export class ApiXConfig {
  private config: ApiXConfigDictionary;

  /**
   * Constructor
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
    } catch {
      this.config = {
        [ApiXConfigKey.MaxRequestAge]: 60000,
        [ApiXConfigKey.Port]: 3000
      };
    }
  }

  /**
   * Retrieves a value for a key
   * @param {string} key key in config
   * @return {unknown} value for provided key
   */
  public valueForKey(key: string): unknown {
    return this.config[key];
  }

  /**
   * Retrieves a value for a key
   * @param {unknown} value the value to set @key
   * @param {string} key key in config
   */
  public setValueForKey(value: unknown, key: string) {
    this.config[key] = value;
  }
}

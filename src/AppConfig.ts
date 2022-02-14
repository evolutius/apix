
export type ConfigDictionary = {[key: string]: unknown};

/**
 * App Configuration Data
 */
export class AppConfig {
  private config: ConfigDictionary;

  /**
   * Constructor
   */
  constructor() {
    this.config = {
      'max_req_date_diff': 5000,
    };
  }

  /**
   * Retrieves a value for a key
   * @param {string} key key in config
   * @return {any} value for provided key
   */
  public valueForKey(key: string): unknown {
    return this.config[key];
  }
}

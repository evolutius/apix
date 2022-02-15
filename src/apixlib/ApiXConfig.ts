
export type ApiXConfigDictionary = {[key: string]: unknown};

/**
 * App Configuration Data
 */
export class ApiXConfig {
  private config: ApiXConfigDictionary;

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

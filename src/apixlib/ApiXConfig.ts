import fs from 'fs';

type ApiXConfigDictionary = {[key: string]: unknown};

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

      if (this.valueForKey('max_req_date_diff') === undefined) {
        this.setValueForKey(5000, 'max_req_date_diff');
      }

      if (this.valueForKey('port') === undefined) {
        this.setValueForKey(3000, 'port');
      }
    } catch {
      this.config = {
        'max_req_date_diff': 5000,
        'port': 3000
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

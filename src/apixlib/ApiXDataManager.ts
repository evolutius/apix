/**
 * An interface for a data manager used for the API.
 * 
 * The data manager is in charge of reading databases for the needed data
 * or resources.
 * 
 * It requires a way to get an Application Key for an API Key and a
 * way to get a User ID for a given Session ID.
 * 
 * @category Working with Databases
 */
export interface ApiXDataManager {
  /**
   * Fetches the application key for a given API key.
   * @param apiKey The API key.
   * @returns The App Key or `null`.
   */
  getAppKeyForApiKey(apiKey: string): string | Promise<string | null> | null;
}

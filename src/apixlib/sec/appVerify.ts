import {AppDataManager} from '../AppDataManager';

/**
 * Verifies that the app making the request is a valid app
 * @param {string} apiKey Api Key of the request
 * @param {AppDataManager} appDataManager data manager
 * @return {boolean} true if API Key is valid
 */
export function appVerify(
    apiKey: string, appDataManager: AppDataManager): boolean {
  return appDataManager.getAppKeyForApiKey(apiKey) != null;
}

import {JsonDictionary} from './JsonDictionary';

/**
 * Verifies if the required parameters exist in the url query
 * @param {[string]} requiredParams Parameters required in request
 * @param {JsonDictionary<string>} urlQueries Request queries
 * @return {boolean} true or false
 */
export function verifyParamsInRequest(
    requiredParams: string[], urlQueries: JsonDictionary<unknown>): boolean {
  for (let i = 0; i < requiredParams.length; ++i) {
    const param = requiredParams[i];
    if (!urlQueries[param]) {
      return false;
    }
  }

  return true;
}

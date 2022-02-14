import {JsonDictionary} from './JsonDictionary';

/**
 * Creates an error response to return to clients
 * @param {string} message Error message
 * @return {JsonDictionary<unknown>} Error JSON Dictionary
 */
export function makeErrorResponse(message: string): JsonDictionary<unknown> {
  return {success: false, message: message};
}

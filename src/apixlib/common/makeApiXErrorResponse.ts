import {ApiXJsonDictionary} from './ApiXJsonDictionary';

/**
 * Creates an error response to return to clients
 * @param {string} message Error message
 * @return {ApiXJsonDictionary<unknown>} Error JSON Dictionary
 */
export function makeApiXErrorResponse(message: string): ApiXJsonDictionary<unknown> {
  return {success: false, message: message};
}

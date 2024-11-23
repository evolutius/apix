import { ApiXJsonDictionary } from '../ApiXJsonDictionary';

/**
 * Creates an error response to return to clients.
 * @param {string} message Error text message.
 * @return {ApiXJsonDictionary<unknown>} Error JSON Dictionary.
 * 
 * @category Creating error responses.
 */
export function makeApiXErrorResponse(message: string): ApiXJsonDictionary<unknown> {
  return { success: false, message: message };
}

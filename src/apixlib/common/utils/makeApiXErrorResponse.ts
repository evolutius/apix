import { ApiXJsonDictionary } from '../ApiXJsonDictionary';

/**
 * Creates an error response to return to clients.
 * @param {string} id An ID that unique identifies the error.
 * @param {string} message Error text message.
 * @return {ApiXJsonDictionary<unknown>} Error JSON Dictionary.
 * 
 * @category Creating error responses.
 */
export function makeApiXErrorResponse(id: string, message: string): ApiXJsonDictionary<unknown> {
  return {
    success: false,
    message, // TODO: Deprecated in favor of the `error` field. In v3.0.0 this will be removed.
    error: {
      id,
      message
    }
  };
}

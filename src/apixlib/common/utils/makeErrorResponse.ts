import { JsonDictionary } from '../JsonDictionary';

/**
 * Creates an error response to return to clients.
 * @param id An ID that unique identifies the error.
 * @param message Error text message.
 * @return Error JSON Dictionary.
 * 
 * @category Creating error responses.
 */
export function makeErrorResponse(id: string, message: string): JsonDictionary<unknown> {
  return {
    success: false,
    message, // TODO: Deprecated in favor of the `error` field. In v3.0.0 this will be removed.
    error: {
      id,
      message
    }
  };
}

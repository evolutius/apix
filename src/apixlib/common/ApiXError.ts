
/**
 * An ID that uniquely identifies an error response.
 */
export type ApiXResponseErrorId = 
  | 'unauthorizedApp'
  | 'unauthorizedRequest'
  | 'invalidRequest'
  | 'missingRequiredHeaders'
  | 'missingJsonBody'
  | 'invalidJsonBody'
  | 'insecureProtocol'
  | 'unknownError';

/**
 * A record of error messages for API responses.
 */
export const errorMessages: Record<ApiXResponseErrorId, string> = {
  unauthorizedApp: 'This application is not authorized to use this service.',
  unauthorizedRequest: 'This request is not authorized.',
  invalidRequest: 'This request is not valid.',
  missingRequiredHeaders: 'Invalid request. Missing required headers.',
  missingJsonBody: 'Invalid request. Missing required HTTP body.',
  invalidJsonBody: 'Invalid request. Invalid HTTP body.',
  insecureProtocol: 'A secure protocol (HTTPS) is required.',
  unknownError: 'An unknown error has occurred.'
};

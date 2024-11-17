/* eslint-disable no-unused-vars */

export const enum ApiXErrorResponseMessage {
  UnauthorizedApp = 'This application is not authorized to use this service.',
  UnauthorizedRequest = 'This request is not authorized.',
  InvalidRequest = 'This request is not valid.',
  MissingRequiredHeaders = 'Invalid request. Missing required headers.',
  MissingJsonBody
    = 'Invalid request. Missing required HTTP body.',
  InvalidJsonBody
    = 'Invalid request. Invalid HTTP body.',
  InsecureProtocol = "A secure protocol (HTTPS) is required.",
  UnknownError = "An unknown error has occurred."
}

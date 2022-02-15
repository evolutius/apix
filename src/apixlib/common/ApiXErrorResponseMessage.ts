/* eslint-disable no-unused-vars */

export enum ApiXErrorResponseMessage {
  unauthorizedApp = 'This application is not authorized to use this service.',
  unauthorizedRequest = 'This request is not authorized.',
  invalidRequest = 'This request is not valid.',
  missingRequiredParams = 'Invalid request. Missing required parameters.',
  missingRequiredMethodParams
    = 'Invalid request. Missing required method parameters.',
}

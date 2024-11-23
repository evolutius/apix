/**
 * Standard HTTP Header request keys.
 * 
 * @enum
 */
export enum ApiXHttpHeaders {
  /**
   * A header containing the API Key of a requesting application.
   */
  ApiKey = 'X-API-Key',

  /**
   * A header containing the authorization token of a request.
   */
  AuthToken = 'Authorization',

  /**
   * A header containing a unique request signature for a request.
   */
  Signature = 'X-Signature',

  /**
   * A header containing a nonce (randomly generated value) used to sign a request.
   */
  SignatureNonce = 'X-Signature-Nonce',

  /**
   * A header containing the client-sided UTC date of when a request was initiated.
   */
  Date = 'Date',

  /**
   * A header containing the original forwarded protocol used for a request.
   */
  ForwardedProto = 'X-Forwarded-Proto'
}

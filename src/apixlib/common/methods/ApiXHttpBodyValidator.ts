import { ApiXRequestInputSchema } from './ApiXRequestInputSchema';

/**
 * An interface used to implement a validator for a JSON body that is
 * part of a request.
 * 
 * @category Working with HTTP Endpoints
 * 
 * @example
 * ```ts
 * interface UserLoginJsonSchema extends ApiXRequestInputSchema {
 *   readonly username: string;
 *   readonly password: string;
 * }
 * 
 * // a simple object to validate the username and password of a login endpoint.
 * class UserLoginHttpBodyValidator implements ApiXHttpBodyValidator<UserLoginJsonSchema> {
 * 
 *   isValid(body: UserLoginJsonSchema): boolean {
 *     const usernameRegex = /^[a-zA-Z0-9]{5,12}$/;
 *     const passwordRegex = /^[a-zA-Z0-9@_.*&$!()-]{8,20}$/;
 *     return this.isString(body.username) && usernameRegex.test(body.username)
 *         && this.isString(body.password) && passwordRegex.test(body.password);
 *   }
 * 
 *   isString(str: unknown): boolean {
 *     return typeof str === 'string';
 *   }
 * }
 * ```
 * 
 * @see {@link ApiXMethod#jsonBodyValidator}
 */
export interface ApiXHttpBodyValidator<T extends ApiXRequestInputSchema> {

  /**
   * Determines if the HTTP body is valid.
   * @param body The body to be validated.
   * @returns A boolean value that determines whether the HTTP Body is valid.
   */
  isValid(body: T): boolean;
}

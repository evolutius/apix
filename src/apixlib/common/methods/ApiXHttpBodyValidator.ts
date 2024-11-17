import { ApiXRequestInputSchema } from './ApiXRequestInputSchema';

/**
 * An interface used to implement a validator for a JSON body that is
 * part of a request.
 */
export interface ApiXHttpBodyValidator<T extends ApiXRequestInputSchema> {

  /**
   * Determines if the HTTP body is valid.
   * @param body The body to be validated.
   * @returns A boolean value that determines whether the HTTP Body is valid.
   */
  isValid(body: T): boolean;
}

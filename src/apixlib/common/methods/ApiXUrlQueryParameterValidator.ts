
/**
 * An interface for a validator of a URL query parameter.
 * 
 * @example
 * ```ts
 * // validates a search keywords parameter.
 * class KeywordsUrlQueryParameterValidator implements ApiXUrlQueryParameterValidator {
 *   isValid(name: string, value: string): boolean {
 *     // keyword are only alphanumeric with limited punctuation. Example only.
 *     const regex = /^[a-zA-Z0-9.,'" ]+$/;
 *     return regex.test(value);
 *   }
 * }
 * ```
 * 
 * @category Working with HTTP Endpoints
 */
export interface ApiXUrlQueryParameterValidator {
  /**
   * Determines whether the value for the parameter is valid.
   * @param name The name of the parameter to validate.
   * @param value The value of the parameter to validate.
   * @returns `true` if the parameter is valid and `false` otherwise.
   */
  isValid(name: string, value: string): boolean;
}

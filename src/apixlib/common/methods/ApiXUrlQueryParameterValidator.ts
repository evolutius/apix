
/**
 * An interface for a validator of a URL query parameter.
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

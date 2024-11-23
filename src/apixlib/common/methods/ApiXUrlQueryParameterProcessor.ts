
/**
 * An object that processes a URL query parameter.
 * 
 * The processor transforms a parameter's value to a format that
 * a method request handler can work with easily. For example, URL
 * query parameters that include lists are often comma-separated, e.g.:
 * `apix.example.com/entity/method?param=value1,value2,value3,value4`.
 * 
 * However, as this is a list, a processor can then turn this value into
 * a `ReadonlyArray<string>`, as an example. The handler can then be
 * implemented with the assumption that the parameter is processed.
 * 
 * @example
 * ```ts
 * // transforms comma-separated strings such as `'mylist,of,values'` into
 * // readonly arrays such as `['mylist', 'of', 'values']`. The parameter
 * // name is always output in camelCase.
 * class CommaSeparatedListUrlQueryParameterProcessor implements ApiXUrlQueryParameterProcessor<ReadonlyArray<string>> {
 *   process(name: string, value: string): [string, ReadonlyArray<string>] {
 *     // any input here has already been pre-validated.
 *     return [this.snakeCaseToCamelCase(name), value.split(',')];
 *   }
 * 
 *   // Converts something like snake_case or SNAKE_CASE to snakeCase.
 *   // it will leave values already in camelCase as camelCase.
 *   snakeCaseToCamelCase(str: string): string {
 *     ...
 *   }
 * }
 * ```
 * 
 * @category Working with HTTP Endpoints
 */
export interface ApiXUrlQueryParameterProcessor<T> {

  /**
   * A method that processes a URL query parameter.
   * @param name The name of the parameter to process.
   * @param value The value of the parameter to process.
   * @returns Returns a tuple containing the `[name, processedValue]`.
   */
  process(name: string, value: string): [string, T];
}

/**
 * A pass-through query parameter processor. All string values are simply
 * returned as string values.
 * 
 * @see {@link ApiXUrlQueryParameterProcessor}
 * 
 * @category Working with HTTP Endpoints
 */
export class ApiXUrlQueryParameterPassthroughProcessor implements ApiXUrlQueryParameterProcessor<string> {
  process(name: string, value: string): [string, string] {
    return [name, value];
  }
}

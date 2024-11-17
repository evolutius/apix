
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

export class ApiXUrlQueryParameterPassthroughProcessor implements ApiXUrlQueryParameterProcessor<string> {
  process(name: string, value: string): [string, string] {
    return [name, value];
  }
}

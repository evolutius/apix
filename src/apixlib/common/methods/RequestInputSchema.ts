
/**
 * An interface to define the schema of a request.
 * 
 * This schema may be the input URL query parameters or
 * HTTP JSON Body.
 * 
 * @example
 * ```ts
 * // An interface that represents the JSON Body schema
 * // for a login method.
 * interface UserLoginJsonSchema extends RequestInputSchema {
 *   readonly username: string;
 *   readonly password: string;
 * }
 * 
 * // An interface that represents the defined URL query parameters
 * // in an endpoint that retrieves books.
 * interface FilterBooksUrlQueryParameters extends RequestInputSchema {
 *   readonly keywords: string; // required, must not be undefined
 *   readonly tags?: ReadonlyArray<string>;  // additional optional tags
 *   readonly authorName?: string;  // additional optional parameter
 *   readonly publicationDateRange?: [Date, Date];  // additional date rate
 * }
 * ```
 * 
 * @category Working with HTTP Endpoints
 */
export interface RequestInputSchema {
  /**
   * @hidden
   */
  readonly _isSchema?: 'marker';
}

import { JsonDictionary } from "./JsonDictionary";

/**
 * A response returned from an `RequestHandler`.
 * 
 * @category Working with API Endpoints
 */
export interface Response {
  /**
   * The HTTP status code. If not provided, defaults to `200`.
   */
  readonly status?: number;

  /**
   * The JSON data of the response.
   */
  readonly data: JsonDictionary<unknown>;
}

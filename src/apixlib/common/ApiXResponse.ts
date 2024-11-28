import { ApiXJsonDictionary } from "./ApiXJsonDictionary";

/**
 * A response returned from an `ApiXRequestHandler`.
 * 
 * @category Working with API Endpoints
 */
export interface ApiXResponse {
  /**
   * The HTTP status code. If not provided, defaults to `200`.
   */
  readonly status?: number;

  /**
   * The JSON data of the response.
   */
  readonly data: ApiXJsonDictionary<unknown>;
}

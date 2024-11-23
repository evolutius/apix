import { ApiXAccessLevel } from './ApiXAccessLevel';
import { ApiXRequestInputSchema } from './methods/ApiXRequestInputSchema';
import { Request } from 'express';

/**
 * A request made to an API-X endpoint. An extension
 * of `express.Request`.
 * 
 * @category Working with API Endpoints
 */
export interface ApiXRequest<
  QuerySchema extends ApiXRequestInputSchema = Record<string, never>,
  BodySchema extends ApiXRequestInputSchema = Record<string, never>
> extends Request {
  /**
   * The access level of the requestor.
   */
  readonly accessLevel: ApiXAccessLevel;

  /**
   * The URL query parameters.
   */
  readonly queryParameters?: QuerySchema;

  /**
   * The HTTP JSON Body.
   */
  readonly jsonBody?: BodySchema;
}

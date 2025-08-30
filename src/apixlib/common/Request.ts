import { AccessLevel } from './AccessLevel';
import { Request as ExpressRequest } from 'express';
import { RequestInputSchema } from './methods/RequestInputSchema';

/**
 * A request made to an API-X endpoint. An extension
 * of `express.Request`.
 * 
 * @category Working with API Endpoints
 */
export interface Request<
  QuerySchema extends RequestInputSchema = Record<string, never>,
  BodySchema extends RequestInputSchema = Record<string, never>
> extends ExpressRequest {
  /**
   * The access level of the requestor.
   */
  readonly accessLevel: AccessLevel;

  /**
   * The URL query parameters.
   */
  readonly queryParameters?: QuerySchema;

  /**
   * The HTTP JSON Body.
   */
  readonly jsonBody?: BodySchema;
}

export function initRequest<
  QuerySchema extends RequestInputSchema,
  BodySchema extends RequestInputSchema
>(
  req: ExpressRequest,
  accessLevel: AccessLevel,
  queryParameters?: QuerySchema,
  jsonBody?: BodySchema
): Request<QuerySchema, BodySchema> {
  return Object.setPrototypeOf({
      ...req,
      accessLevel,
      queryParameters,
      jsonBody
    },
    Object.getPrototypeOf(req)
  );
}

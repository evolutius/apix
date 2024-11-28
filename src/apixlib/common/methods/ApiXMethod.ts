import { ApiXHttpBodyValidator } from './ApiXHttpBodyValidator';
import { ApiXMethodCharacteristic } from './ApiXMethodCharacteristic';
import { ApiXRequest } from '../ApiXRequest';
import { ApiXRequestInputSchema } from './ApiXRequestInputSchema';
import { ApiXResponse } from '../ApiXResponse';
import { ApiXUrlQueryParameter } from './ApiXUrlQueryParameter';
import { Response } from 'express';

/**
 * A request handler function type.
 * 
 * @category Working with HTTP Endpoints
 * 
 * @see {@link ApiXMethod#requestHandler}
 */
export type ApiXRequestHandler<
  QuerySchema extends ApiXRequestInputSchema,
  BodySchema extends ApiXRequestInputSchema
> = (
  req: ApiXRequest<QuerySchema, BodySchema>,
  res: Response
) => ApiXResponse | Promise<ApiXResponse>;

/**
 * Interface for an ApiXMethod.
 * 
 * Represents an endpoint in you an API-X-based RESTful API. Your
 * endpoint is reaches at `/{entity}/{method}`. If an entity is not
 * defined, then it will be `/{method}`.
 * 
 * @category Working with HTTP Endpoints
 * @document ../../../../documentation/Implementing_API_X_Endpoints.md
 * 
 * @see {@link ApiXManager#registerAppMethod}
 */
export interface ApiXMethod<
  QuerySchema extends ApiXRequestInputSchema = Record<string, never>,
  BodySchema extends ApiXRequestInputSchema = Record<string, never>
> {
  /**
   * An optional entity for your endpoint.
   * 
   * Entities are the first path part in your endpoints.
   * - `/{entity}/{method}` - if an entity is defined.
   * 
   * Entities are a great way to scope your methods. For example,
   * user-based methods can be under the `user` entity, and your
   * `method` can define the kind of operation to perform on the
   * `user` entity:
   * - `/user/new/` - defines an operation that creates a new user.
   * - `/user/delete/` - defines an operation to delete a new user.
   * - `/user/:id` - defines an operation to get data on an arbitrary
   * user.
   * 
   * It is _recommended_ that an entity is used for all methods.
   * 
   * @category Setting Endpoint Path
   */
  readonly entity?: string;

  /**
   * The method name for your endpoint. This is typically used to
   * define the operation of your endpoint, and if no `entity` is
   * provided, it is the first path part in your endpoint. Otherwise,
   * it goes after `entity`.
   * 
   * Assuming an entity of `user`, new methods can be created to
   * define operations that can be made on users:
   * - `/user/new/` - defines an operation that creates a new user (method = new).
   * - `/user/delete/` - defines an operation to delete a new user (method = delete).
   * - `/user/:id` - defines an operation to get data on an arbitrary user (method = :id).
   * 
   * As seen in the example above, a method can have a template for a parameter,
   * such as `":id"`.
   * 
   * @category Setting Endpoint Path
   */
  readonly method: string;

  /**
   * Handlers for the endpoint. The method is expected to return a JSON response.
   * 
   * All validation and verification is performed before the request reaches your
   * handler. However, if the need arises, you can perform any application-specific
   * verification here as well.
   * 
   * @category Handling Requests
   */
  readonly requestHandler: ApiXRequestHandler<QuerySchema, BodySchema>;

  /**
   * The HTTP method of your endpoint.
   * 
   * @category Setting HTTP Method
   */
  readonly httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL';

  /**
   * A list of defined query parameters for the method.
   * 
   * If this list is non-empty, the API-X manager will verify that the parameters
   * are valid, required parameters are present and non-empty, and process them.
   * 
   * The parsed parameters will be passed to the `requestHandler` in the template
   * schema set.
   * 
   * @category Handling Query Parameters
   */
  readonly queryParameters?: ReadonlyArray<ApiXUrlQueryParameter<unknown>>;

  /**
   * An object that validates the JSON body of the request. If present and there's
   * an HTTP Body, the request is validated.
   * 
   * Set `jsonBodyRequired` to `true` if you want an immediate failure if the body
   * is missing or empty.
   * 
   * @category Handling Request JSON Body
   */
  readonly jsonBodyValidator?: ApiXHttpBodyValidator<BodySchema>;

  /**
   * A boolean value that determines whether the request must include an HTTP
   * JSON body.
   * 
   * @category Handling Request JSON Body
   */
  readonly jsonBodyRequired?: boolean;

  /**
   * The characteristics that this endpoint has. API-X uses these characteristics
   * to determine what level of access a requestor has to have to access the
   * endpoint.
   * 
   * This set must _not_ be empty.
   * 
   * @category Managing Access Control
   */
  readonly characteristics: ReadonlySet<ApiXMethodCharacteristic>;

  /**
   * A function that determines whether the requestor (`request`) owns
   * the resource they are asking to access from this endpoint.
   * 
   * The _resource_ is the data or operation that the endpoint provides.
   * The _requestor_ is the identity of the application or user asking for
   * the _resource_.
   * 
   * This _must_ be implemented for endpoints that provide owned resources, i.e.,
   * have the `ApiXMethodCharacteristic.PublicOwnedData`
   * or `ApiXMethodCharacteristic.PrivateOwnedData`, otherwise it'll throw an error
   * when attempting to register method.
   * 
   * @param request The request object that contains the identity
   * of the requestor.
   * @returns `true` if the requestor owns it, false otherwise.
   * 
   * @example
   * ```ts
   * // An API-X Endpoint that returns data for a given user.
   * const getUserData = {
   *   endpoint: 'users',
   *   method: ':uid',
   *   ...,
   *   requestorOwnsResource: (request) => {
   *     const userId = 
   *   }
   * }
   * ```
   * 
   * @category Managing Access Control
   */
  readonly requestorOwnsResource?: (request: ApiXRequest<QuerySchema, BodySchema>) => boolean | Promise<boolean>;
}

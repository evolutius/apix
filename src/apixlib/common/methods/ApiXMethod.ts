import { ApiXHttpBodyValidator } from './ApiXHttpBodyValidator';
import { ApiXJsonDictionary } from '../ApiXJsonDictionary';
import { ApiXMethodCharacteristic } from './ApiXMethodCharacteristic';
import { ApiXRequest } from '../ApiXRequest';
import { ApiXRequestInputSchema } from './ApiXRequestInputSchema';
import { ApiXUrlQueryParameter } from './ApiXUrlQueryParameter';
import { Response } from 'express';

/**
 * A request handler function type.
 */
export type ApiXRequestHandler<
  QuerySchema extends ApiXRequestInputSchema,
  BodySchema extends ApiXRequestInputSchema
> = (
  req: ApiXRequest<QuerySchema, BodySchema>,
  res: Response
) => ApiXJsonDictionary<unknown> | Promise<ApiXJsonDictionary<unknown>>;

/**
 * Interface for an ApiXMethod.
 * 
 * Represents an endpoint in you an API-X-based RESTful API. Your
 * endpoint is reaches at `/{entity}/{method}`. If an entity is not
 * defined, then it will be `/{method}`.
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
   */
  readonly method: string;

  /**
   * Handlers for the endpoint. The method is expected to return a JSON response.
   * 
   * All validation and verification is performed before the request reaches your
   * handler. However, if the need arises, you can perform any application-specific
   * verification here as well.
   */
  readonly requestHandler: ApiXRequestHandler<QuerySchema, BodySchema>;

  /**
   * The HTTP method of your endpoint.
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
   */
  readonly queryParameters?: ReadonlyArray<ApiXUrlQueryParameter<unknown>>;

  /**
   * An object that validates the JSON body of the request. If present and there's
   * an HTTP Body, the request is validated.
   * 
   * Set `jsonBodyRequired` to `true` if you want an immediate failure if the body
   * is missing or empty.
   */
  readonly jsonBodyValidator?: ApiXHttpBodyValidator<BodySchema>;

  /**
   * A boolean value that determines whether the request must include an HTTP
   * JSON body.
   */
  readonly jsonBodyRequired?: boolean;

  /**
   * The characteristics that this endpoint has. API-X uses these characteristics
   * to determine what level of access a requestor has to have to access the
   * endpoint.
   * 
   * This set must _not_ be empty.
   */
  readonly characteristics: ReadonlySet<ApiXMethodCharacteristic>;
}

import { ApiXAccessLevel } from './ApiXAccessLevel';
import { ApiXMethod } from './methods/ApiXMethod';
import { ApiXRequestInputSchema } from './methods/ApiXRequestInputSchema';
import { Request } from 'express';

/**
 * An interface to implement for a class that evaluates a request's access
 * level to a given method.
 * 
 * An evaluator manages access to a given method or a resource made by a
 * requestor. Some requestors may have fixed access levels regardless of
 * the method. For example, the API owner or its adminitrators may have a
 * fixed access of `Admin`.
 * 
 * However, some requestors may have difference access depending on the
 * resource they are attempting to access. For example, a user attempting to
 * access its own resources via its method can have a access level of `ResourceOwner`,
 * while the same requestor may only have `AuthenticatedRequestor` if the resources requested
 * belong to another user, or maybe even `Public` or `NoAccess` if the resources they
 * are attempting to access are too restrictive.
 * 
 * It's the responsibility of the application owner to implement the functionality
 * to determine the access level that any requestor should have to a given
 * method.
 * 
 * It's the responsibility of the request handler to determine how much information
 * can be sent to the requestor given their access level. For example, a requestor
 * with `ResourceOwner` accessing a method that only requires `AuthenticatedRequestor` may be able to access
 * additional resources within the method, should they request it.
 * 
 * @category Resource Access Permissions
 */
export interface ApiXAccessLevelEvaluator {
  /**
   * Returns the level of access required that the requestor has to access
   * the resources from the method.
   * @param {ApiXMethod} appMethod The method to be accessed.
   * @param {Request} req The request that wants to access the method.
   */
  evaluate<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    appMethod: ApiXMethod<QuerySchema, BodySchema>,
    req: Request
  ): ApiXAccessLevel | Promise<ApiXAccessLevel>;
}

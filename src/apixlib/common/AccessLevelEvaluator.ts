/* eslint-disable @typescript-eslint/no-unused-vars */
import { AccessLevel } from './AccessLevel';
import { EndpointMethod } from './methods/EndpointMethod';
import { MethodCharacteristic } from './methods/MethodCharacteristic';
import { Request } from './Request';
import { RequestInputSchema } from './methods/RequestInputSchema';

/**
 * A class that evaluates a request's access level for a given endpoint method.
 * 
 * This evaluator determines whether a requestor has access to a specific method
 * or resource. Requestors may have fixed access levels, such as `Admin` for API owners
 * and administrators, or variable access levels based on the resources being accessed.
 * 
 * For example, a user accessing their own resources may be assigned `ResourceOwner` access,
 * while accessing another user's resources might result in `AuthenticatedRequestor` or
 * even `NoAccess`, depending on the restrictions.
 * 
 * To implement more granular control (e.g., banning users, handling bots, or managing
 * authenticated access), subclass this class and implement specific methods like:
 * - `isDeniedRequestor`: Deny access to certain requestors (e.g., banned users).
 * - `isAuthenticatedRequestor`: Validate if a requestor is authenticated.
 * - `isInternalRequestor`: Identify if a requestor is an internal user or admin.
 * 
 * *Note*: If your API methods have characteristics like `Internal`, `Moderative`,
 * or `Institutional`, you must implement the corresponding methods to evaluate
 * these characteristics correctly. Otherwise, requestors will be assumed not to have
 * the required access.
 * 
 * @category Resource Access Permissions
 */
export class AccessLevelEvaluator {
  /**
   * Returns the level of access required that the requestor has to access
   * the resources from the method.
   * @param {Method} appMethod The method to be accessed.
   * @param {Request} req The request that wants to access the method.
   */
  async evaluate<
    QuerySchema extends RequestInputSchema,
    BodySchema extends RequestInputSchema
  >(
    appMethod: EndpointMethod<QuerySchema, BodySchema>,
    req: Request<QuerySchema, BodySchema>
  ): Promise<AccessLevel> {

    if ((await this.isDeniedRequestor(req))) {
      return AccessLevel.NoAccess;
    }

    // Internal
    if (appMethod.characteristics.has(MethodCharacteristic.Internal)
     && (await this.isInternalRequestor(req))) {
      return AccessLevel.Admin;
    }

    // Moderative
    if (appMethod.characteristics.has(MethodCharacteristic.Moderative)
      && (await this.isModerativeRequestor(req))) {
      return AccessLevel.Moderator;
    }

    // Institutional
    if (appMethod.characteristics.has(MethodCharacteristic.Institutional)
      && (await this.isInstitutionalRequestor(req))) {
      return AccessLevel.Manager;
    }

    // Privileged
    if (appMethod.characteristics.has(MethodCharacteristic.Special)
      && (await this.isPrivilegedRequestor(req))) {
      return AccessLevel.PrivilegedRequestor;
    }

    // Determine highest level of ownership for methods w/ resources / data.
    if (appMethod.characteristics.has(MethodCharacteristic.PrivateOwnedData)
     && (await appMethod.requestorOwnsResource?.(req))) {
      // This method provides private data / resources and requestor owns the data.
      return AccessLevel.ResourceOwner;
    } else if (appMethod.characteristics.has(MethodCharacteristic.PublicOwnedData)) {
      // This method provides public owned data, so resource owners and authenticated
      // requestors may access it.
      if ((await appMethod.requestorOwnsResource?.(req))) {
        return AccessLevel.ResourceOwner;
      } else if ((await this.isAuthenticatedRequestor(req))) {
        return AccessLevel.AuthenticatedRequestor;
      } else {
        return AccessLevel.PublicRequestor;
      }
    } else if (appMethod.characteristics.has(MethodCharacteristic.PublicUnownedData)) {
      if ((await this.isAuthenticatedRequestor(req))) {
        return AccessLevel.AuthenticatedRequestor;
      } else {
        return AccessLevel.PublicRequestor;
      }
    }

    return AccessLevel.NoAccess
  }

  //// Abstract / optional methods ////
  /**
   * Determines whether a requestor is denied access.
   * 
   * This method can be overwritten to deny access to certain requestors,
   * e.g., banned users, bots, users with expired / invalid tokens.
   * 
   * This method can be used to require anything from requestors, e.g.,
   * authentication. You can decide what are the absolute minimum requirements
   * to access your API.
   * 
   * @param req The request containing the identity of the requestor.
   * @returns A boolean that determines whether the requestor is denied access.
   */
  protected isDeniedRequestor<
    QuerySchema extends RequestInputSchema,
    BodySchema extends RequestInputSchema
  >(
    req: Request<QuerySchema, BodySchema>
  ): Promise<boolean> | boolean {
    return false;
  }

  /**
   * Determines whether a requestor is an internal user / admin.
   * 
   * This method _must_ be overwritten in cases where methods with
   * the `Internal` characteristics exist otherwise it'll be assumed
   * that the requestor is *not* internal / an admin.
   * 
   * @param req The request containing the identity of the requestor.
   * @returns A boolean that determines whether the requestor is internal / an admin.
   */
  protected isInternalRequestor<
    QuerySchema extends RequestInputSchema,
    BodySchema extends RequestInputSchema
  >(
    req: Request<QuerySchema, BodySchema>
  ): Promise<boolean> | boolean {
    return false;
  }

  /**
   * Determines whether a requestor is a moderator.
   * 
   * This method _must_ be overwritten in cases where methods with
   * the `Moderative` characteristics exist otherwise it'll be assumed
   * that the requestor is *not* a moderator.
   * 
   * @param req The request containing the identity of the requestor.
   * @returns A boolean that determines whether the requestor is moderator.
   */
  protected isModerativeRequestor<
    QuerySchema extends RequestInputSchema,
    BodySchema extends RequestInputSchema
  >(
    req: Request<QuerySchema, BodySchema>
  ): Promise<boolean> | boolean {
    return false;
  }

  /**
   * Determines whether a requestor is instituitional, e.g., an internal
   * company's manager or employee.
   * 
   * This method _must_ be overwritten in cases where methods with
   * the `Instituitional` characteristics exist otherwise it'll be assumed
   * that the requestor is *not* institutional.
   * 
   * @param req The request containing the identity of the requestor.
   * @returns A boolean that determines whether the requestor is institutional.
   */
  protected isInstitutionalRequestor<
    QuerySchema extends RequestInputSchema,
    BodySchema extends RequestInputSchema
  >(
    req: Request<QuerySchema, BodySchema>
  ): Promise<boolean> | boolean {
    return false;
  }

  /**
   * Determines whether a requestor is priveleged / special.
   * 
   * This method _must_ be overwritten in cases where methods with
   * the `Special` characteristics exist otherwise it'll be assumed that the
   * requestor is *not* priveleged.
   * 
   * @param req The request containing the identity of the requestor.
   * @returns A boolean that determines whether the requestor is privileged.
   */
  protected isPrivilegedRequestor<
    QuerySchema extends RequestInputSchema,
    BodySchema extends RequestInputSchema
  >(
    req: Request<QuerySchema, BodySchema>
  ): Promise<boolean> | boolean {
    return false;
  }

  /**
   * Determines whether a requestor is authenticated.
   * 
   * This method _must_ be overwritten in cases where authentication
   * is supported in the API-X otherwise it'll be assumed that the
   * requestor is *not* authenticated.
   * 
   * @param req The request containing the identity of the requestor.
   * @returns A boolean that determines whether the requestor is authenticated.
   */
  protected isAuthenticatedRequestor<
    QuerySchema extends RequestInputSchema,
    BodySchema extends RequestInputSchema
  >(
    req: Request<QuerySchema, BodySchema>
  ): Promise<boolean> | boolean {
    return false;
  }
}

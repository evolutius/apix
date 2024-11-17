Access levels are API-X mechanism that evaluates who has access to what resources and to what extent. It has enough flexibility for developers to decide how and to what extent to protect their data.

Fixed access levels are defined for each endpoint based on the data or operation it grants access to. Additionlly, each valid request has its own access level that determines the access it has to the endpoint that the request is directed to.

## Levels

API-X has a clear guidance on how access levels and characteristics should be assigned to control access to resources.

### Setting Endpoint Characteristics

API-X endpoints use characteristics to determine the minimum access levels required to access them. There are several characteristics that can be assigned to endpoints:

| Characteristic | Description | Resulting Access Level |
|----------------|-------------|---------------------------|
| Internal | Endpoints for superusers, administrators, server owners. | **Admin** |
| Moderative | Endpoints content editors and moderators, such as banning users, posts, etc. | **Moderator** |
| Institutional | Endpoints for a private instuition and its employees or the like. | **Manager** |
| Special | Endpoints available to select group or individuals with special privileges, such as beta testers. | **Privileged Requestor** |
| Private Owned Data | Endpoints that process or serve owned data, e.g., data for specific users. | **Resource Owner** |
| Public Owned Data | Endpoints that can process or serve data owned by an entity but meant to be publically available, e.g., a user's username in a social media platform. | **Authenticated Requestor** |
| Public Unowned Data | Endpoints that return data that isn't owned by any entity and is meant for the public consumption by authorized requestor. | **Public Requestor** |

_Note: It is the responsibility of each endpoint handler to fulfill the promise of its characteristics. See example from the next section for details._

### Determining Access Levels for Requests

When a valid request is received, API-X will ask developers the level of access the request should have. The guidance for assigning access levels is as follows:

| Requestor | Endpoint | Recommended Access Level |
|-----------|----------|-----------------------------|
| A superuser or adminitrator of the server. | Any endpoint. | **Admin** |
| A content moderator or editor with elevated priviledges. | Any non-internal endpoint. | **Moderator** |
| Employee users or applications. | Any non-internal or moderative enpoint. | **Manager** |
| A group or individual with special privileges (such as beta testers). | Only endpoints designated as special use for the group or individual. | **Privileged Requestor** |
| A user or application requesting access to its own data. | Endpoints that serves resources owned by the requesting application or user. | **Resource Owner** |
| A user or application requesting access public but owned data. | Endpoints that can process or return public owned data. | **Authenticated Requestor** |
| An authenticated application that does not fall in any other category. | Endpoints that return data meant for the public consumption of authorized applications. | **Public Requestor** |
| One requesting access to a resource they should not have access to for any reason. | Any endpoint. | **None** |

## Example Endpoint Implementation

Below is an example endpoint that allows one to retrieve data for a specific user in a social media platform-like service. This endpoint can return data that's deemed public but owned by a user, such as username, profile photo, etc., but also data that is private and owned by a user, and as such phone number, ID, etc.

For this reason, this API-X endpoint has two characteristics:
1. `PrivateOwnedData`; and,
2. `PublicOwnedData`.

API-X will determine that a minimum access level of 5 is then required to access it, but it's the request handler's responsibility to fulfill its promise to deliver Resource Owner data (privately owned data) if the requestor has enough access.

```ts
/**
 * This endpoint returns data about specific users.
 */
const endpoint: ApiXMethod = {
  entity: 'users',
  method: '{id}',
  httpMethod: 'GET',
  characteristics: new Set([
    ApiXMethodCharacteristic.PrivateOwnedData,
    ApiXMethodCharacteristic.PublicOwnedData,
  ]),
  requestHandler: async (request, response) => {

    /// ... all input validation for user ID is done before this point ... ///

    /// Any request is guaranteed to have at least AuthenticatedRequestor as API-X won't
    /// let any requests without access to reach the endpoint.

    /// However, we can now control the level of access.
    if (request.accessLevel === ApiXAccessLevel.AuthenticatedRequestor) {
      /// According to guidance, this access level should only provide access to public owned data,
      /// so here we only return the user's public data; examples include a username, profile photo, etc.
      const userData = await getUserPublicData(userId);

      /// ... validate user data ... ///
      return userData;
    } else {
      /// Anyone with a higher access level can access the user's private data; examples include
      /// a phone number, email, etc.

      const userData = await getUserPrivateData(userId);

      /// ... validate user data ... ///
      return userData;
    }
  }
};
```

## Determining Requestor Access Level

In this previous example, a user's data is classified as either public owned data or private owned data, and for each request, the endpoint serves _all_ the data that the requestor has access to. However, in some cases, developers may want the requestor to ask for specific data that they require, for example, username, email, etc., and provide access to only that. API-X provides the mechanism to support such granularity.

It's possible to implement such granularity at the request handler level and simply reject any request asking for data it shouldn't have access to. However, as a best practice, _all access control request rejection should happen prior to reaching the endpoint handler_. Developers can implement such a feature by implementing it into access level evaluator.

```ts
class MyApiEvaluator extends ApiXAccessLevelEvaluator {
  async determine(appMethod: ApiXMethod, req: Request): ApiXAccessLevel | Promise<ApiXAccessLevel> {
    /// Use the provided guidance to implement your access levels. Below is an example implementation of it.
    const user = await getRequestingUser(req);

    if (user.isBlockListed) {
      /// Perhaps some admin or moderator banned this user for some reason.
      return ApiXCleranceLevel.NoAccess; /// auto-rejection.
    }

    if (user.isAdmin) {
      return ApiXAccessLevel.Admin;
    } else if (user.isModerator) {
      return isMethodInternal(appMethod) ? ApiXAccessLevel.NoAccess : ApiXAccessLevel.Moderator;
    } else if (user.isEmployee) {
      return isMethodForModeratorOrInternal(appMethod) ? ApiXAccessLevel.NoAccess : ApiXAccessLevel.Manager;
    } else if (user.isBetaTester && isBetaMethodForTesting(appMethod)) {
      return ApiXAccessLevel.PrivilegedRequestor;
    }

    /// Beta users accessing non-beta methods or regular users get regular treatment
    if (!user.isAuthenticated) {
      /// Unauthenticated users can just get the lowest level of access.
      return ApiXAccessLevel.PublicRequestor;
    }

    if (isMethodPrivateOwnedDataOnly(appMethod)) {
      /// User owns the resources it may request, so we grant Resource Owner
      return isUserDataOwnerInRequest(user, req) ? ApiXAccessLevel.ResourceOwner : ApiXAccessLevel.NoAccess;
    } else (isMethodOwnedDataOnly(appMethod)) {
      /// If requestor is asking for resources that are owned but they are not the owner,
      /// we automatically return `NoAccess` which is the equivalent of rejecting a request.
      return isUserDataOwnerInRequest(user, req)
        ? ApiXAccessLevel.ResourceOwner : ApiXAccessLevel.NoAccess;
    }

    /// Every other requestor gets a Authenticated Requestor which grants access to non-owned resources.
    return ApiXAccessLevel.AuthenticatedRequestor;
  }

  async getRequestingUser(req: Request): Promise<User> {
    /// As an example, use JWTs to get user information and/or make database reads as needed.

    return user;
  }

  private isMethodInternal(appMethod: ApiXMethod): boolean {
    return appMethod.has(ApiXMethodCharacteristic.Internal);
  }

  private isMethodForModeratorOrInternal(appMethod: ApiXMethod): boolean {
    return appMethod.has(ApiXMethodCharacteristic.Internal)
      || appMethod.has(ApiXMethodCharacteristic.Moderative);
  }

  private isBetaMethodForTesting(appMethod: ApiXMethod): boolean {
    /// In this hypothetical, all "Special" methods are designed for beta testers.
    return appMethod.has(ApiXMethodCharacteristic.Special);
  }

  private isMethodPrivateOwnedDataOnly(appMethod: ApiXMethod): boolean {
    return appMethod.has(ApiXMethodCharacteristic.PrivateOwnedData)
      && !appMethod.has(ApiXMethodCharacteristic.PrivateOwnedData)
      && !appMethod.has(ApiXMethodCharacteristic.PublicUnownedData);
  }

  private isMethodOwnedDataOnly(appMethod: ApiXMethod): boolean {
    return appMethod.has(ApiXMethodCharacteristic.PrivateOwnedData)
      && appMethod.has(ApiXMethodCharacteristic.PrivateOwnedData)
      && !appMethod.has(ApiXMethodCharacteristic.PublicUnownedData);
  }

  private isUserDataOwnerInRequest(user: User, req: Request): boolean {
    /// Example implementation only
    return req.headers['X-Resource-ID'] === user.id;
  }
}
```



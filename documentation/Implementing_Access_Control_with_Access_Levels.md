---
title: Implementation Access Control with Access Levels
category: Developer Documentation
group: Security
---
# Implementation Access Control with Access Levels

Access levels are an API-X mechanism that evaluate who has access to what resources and to what extent. API-X provides flexibility for you to decide how and to what extent to protect your data, while simplifying the implementation.

Fixed access levels are defined for each endpoint based on the data or operation it grants access to. Additionally, each valid request has its own access level that determines what access it has to the endpoint it is directed to.

## Levels

API-X provides clear guidance on how access levels and characteristics should be assigned to control access to resources.

### Setting Endpoint Characteristics

API-X endpoints use characteristics to determine the minimum access levels required to access them. There are several characteristics that can be assigned to endpoints:

| Characteristic      | Description                                                                                                                                         | Resulting Access Level      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Internal            | Endpoints for superusers, administrators, server owners.                                                                                            | **Admin**                   |
| Moderative          | Endpoints for content editors and moderators, such as banning users, posts, etc.                                                                    | **Moderator**               |
| Institutional       | Endpoints for a private institution and its employees.                                                                                              | **Manager**                 |
| Special             | Endpoints available to select groups or individuals with special privileges, such as beta testers.                                                  | **Privileged Requestor**    |
| Private Owned Data  | Endpoints that process or serve owned data, e.g., data for specific users.                                                                          | **Resource Owner**          |
| Public Owned Data   | Endpoints that can process or serve data owned by an entity but meant to be publicly available, e.g., a user's username in a social media platform. | **Authenticated Requestor** |
| Public Unowned Data | Endpoints that return data that isn't owned by any entity and is meant for public consumption by authorized requestors.                             | **Public Requestor**        |

*Note: It is the responsibility of each endpoint handler to fulfill the promise of its characteristics. See example from the next section for details.*

### Determining Access Levels for Requests

API-X determines the access level a request should have based on specific conditions, ensuring the appropriate level of access for each type of requestor and endpoint:

| Requestor                                                              | Endpoint                                                                            | Recommended Access Level    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------- |
| A superuser or administrator of the server.                            | Any endpoint.                                                                       | **Admin**                   |
| A content moderator or editor with elevated privileges.                | Any non-internal endpoint.                                                          | **Moderator**               |
| Employee users or applications.                                        | Any non-internal or moderative endpoint.                                            | **Manager**                 |
| A group or individual with special privileges (such as beta testers).  | Only endpoints designated as special use for the group or individual.               | **Privileged Requestor**    |
| A user or application requesting access to its own data.               | Endpoints that serve resources owned by the requesting application or user.         | **Resource Owner**          |
| A user or application requesting access to public but owned data.      | Endpoints that can process or return publicly owned data.                           | **Authenticated Requestor** |
| An authenticated application that does not fall in any other category. | Endpoints that return data meant for public consumption of authorized applications. | **Public Requestor**        |
| A requestor attempting access to a restricted resource.                | Any endpoint.                                                                       | **None**                    |

## Example Endpoint Implementation

Below is an example endpoint that allows you to retrieve data for a specific user in a social media platform-like service. This endpoint can return data deemed public but owned by a user, such as a username, profile photo, etc., or data that is private and owned by the user, such as a phone number, ID, etc.

For this reason, this API-X endpoint has two characteristics:

1. `PrivateOwnedData`
2. `PublicOwnedData`

API-X will determine that a minimum access level of \`AuthenticatedRequestor\` is then required to access it, but it's the request handler's responsibility to fulfill its promise to deliver Resource Owner data (privately owned data) if the requestor has enough access.

```typescript
/**
 * This endpoint returns data about specific users.
 */
const endpoint: ApiXMethod = {
  entity: 'users',
  method: ':id',
  httpMethod: 'GET',
  characteristics: new Set([
    ApiXMethodCharacteristic.PrivateOwnedData,
    ApiXMethodCharacteristic.PublicOwnedData,
  ]),
  requestHandler: async (request, response) => {
    const userId = request.params.id;
    /// ... all input validation for user ID is done before this point ... ///

    /// Any request is guaranteed to have at least AuthenticatedRequestor as API-X won't
    /// let any requests without access reach the endpoint.

    /// However, we can now control the level of access.
    if (request.accessLevel === ApiXAccessLevel.AuthenticatedRequestor) {
      /// According to guidance, this access level should only provide access to public owned data,
      /// so here we only return the user's public data; examples include a username, profile photo, etc.
      const data = await getUserPublicData(userId);

      /// ... validate user data ... ///
      return { data };
    } else {
      /// Anyone with a higher access level can access the user's private data; examples include
      /// a phone number, email, etc.

      const data = await getUserPrivateData(userId);

      /// ... validate user data ... ///
      return { data };
    }
  }
};
```

## Using `ApiXAccessLevelEvaluator`

To control access to your endpoints, you can now subclass `ApiXAccessLevelEvaluator`, which provides most of the evaluation logic for you. In most cases, you only need to implement `isAuthenticatedRequestor` for authentication and `isDeniedRequestor` for banning users or bots. The other methods, such as `isInternalRequestor`, are meant for more granular access control and are not needed for most APIs.

The `ApiXAccessLevelEvaluator` class is designed to simplify access level evaluation by allowing you to customize behavior where necessary. Here is a list of methods that can be overridden:

- `isDeniedRequestor`: Determines if a requestor should be denied access (e.g., banned users or bots). This method should be implemented if you need to restrict access to specific users, such as those banned or identified as bots. It can also be used to invalidate sessions and authorization tokens.
- `isAuthenticatedRequestor`: Determines if a requestor is authenticated. If dealing with user authentication, this method **must** be implemented; otherwise, it will be assumed that the requestor is **not** authenticated.
- `isInternalRequestor`: Determines if a requestor is an internal user/admin. This method **must** be implemented if an `ApiXMethod` has the `Internal` characteristic; otherwise, it will be assumed that the requestor is **not** internal/admin.
- `isModerativeRequestor`: Determines if a requestor is a moderator. This method **must** be implemented if an `ApiXMethod` has the `Moderative` characteristic; otherwise, it will be assumed that the requestor is **not** a moderator.
- `isInstitutionalRequestor`: Determines if a requestor is an institutional user (e.g., manager or employee). This method **must** be implemented if an `ApiXMethod` has the `Institutional` characteristic; otherwise, it will be assumed that the requestor is **not** institutional.
- `isPrivilegedRequestor`: Determines if a requestor is privileged (e.g., beta testers). This method **must** be implemented if an `ApiXMethod` has the `Special` characteristic; otherwise, it will be assumed that the requestor is **not** privileged.

The core `evaluate` method in `ApiXAccessLevelEvaluator` handles the majority of use cases by evaluating the characteristics of a method and the requestor's role, using the above methods as needed. You should only override `evaluate` if you have a very specific, non-standard access control requirement.

The `ApiXAccessLevelEvaluator` class is designed to simplify access level evaluation by allowing you to customize behavior where necessary. You only need to implement specific methods such as:

- `isDeniedRequestor`: Determines if a requestor should be denied access (e.g., banned users or bots).
- `isAuthenticatedRequestor`: Determines if a requestor is authenticated.
- `isInternalRequestor`: Determines if a requestor is an internal user/admin.

The core `evaluate` method in `ApiXAccessLevelEvaluator` handles the majority of use cases by evaluating the characteristics of a method and the requestor's role, using the above methods as needed. You should only override `evaluate` if you have a very specific, non-standard access control requirement.

Here's an example of how to subclass `ApiXAccessLevelEvaluator` to define access control:

```typescript
class MyApiEvaluator extends ApiXAccessLevelEvaluator {
  async isDeniedRequestor(req: ApiXRequest): Promise<boolean> {
    const user = await getRequestingUser(req);
    return user.isBlockListed;
  }

  async isAuthenticatedRequestor(req: ApiXRequest): Promise<boolean> {
    const user = await getRequestingUser(req);
    return user.isAuthenticated;
  }

  /// Optionally override `evaluate` for special cases
  async evaluate(appMethod: ApiXMethod, req: ApiXRequest): Promise<ApiXAccessLevel> {
    /// Use the base class's evaluation and customize where necessary
    const baseAccessLevel = await super.evaluate(appMethod, req);
    
    /// Add custom logic if needed
    if (someCustomCondition) {
      return ApiXAccessLevel.PrivilegedRequestor;
    }

    return baseAccessLevel;
  }
}
```

By subclassing `ApiXAccessLevelEvaluator`, you can easily manage access levels without needing to rewrite the entire evaluation process. Implement only the specific methods you need, and let the core logic handle the rest.

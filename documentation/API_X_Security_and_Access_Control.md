API-X is designed to allow developers to implement secure endpoints with simplicity and flexibility. It allows developers to use one of several well tested authentication and authorization mechanisms, and provides options while abstracting the complicates details behind each approach.

API-X will ask developers simple questions such as:

- Who does this API Key belong to (a simple database read);
- How much authority does this application have (with guidelines to take the guess work out of it).

It will then use the answer to those questions to protect your API against malicious requests and provided access control for authorized requests.

## Secure Transport Enforcement

API-X enforces the use of SSL / TLS encrypted endpoints. Each request received by the API-X manager will be verified to have come from an encrypted connection, and any request that doesn't meet this requirement is rejected. This is used to encourage all developers to use an encrypted connection.

When endpoints are not encrypted, anyone on the same network as any client can see the contents of a request and find attack vectors to compromise users, endpoints, and data.

_Note: While API-X does enforce encrypted endpoints, it is still the developer's responsibility to enable SSL / TLS / HTTPS on their server. API-X will simply refuse to serve non-encrypted requests. Additionally, API-X provides a developer mode that temporarily disables this requirements. Developer mode is designed to help developers build fast. It disables many security mechanism and it is **critical** that it be disabled in a production environment._

> For more information on Developer Mode, see `ApiXManager.developerModeEnabled`.

## Request Integrity Verification

Each request received by API-X will be verified to contain all required security fields, application verification, and access control prior to reaching the handler for your endpoint. This ensures that any request that reaches any endpoint is already a valid one, and handlers just need to perform verification on the value of required fields.

This removes most of the validation and verification burden away from the developers so that they can focus on the business logic of their endpoints.

## Application-Level Authentication

Authentication is about _who_ is making a request to an API. An API-X API only serves requests to authorized applications, and it takes steps a few steps to _identify_ the application making each request. API-X uses Application Identity Verification to either serve or reject requests. Valid clients must provide a previously supplied API Key via the `X-API-Key` header:

```
X-API-Key: <api_key>
```

API-X then will use a data manager ask developers a simple question:

> Who is this API Key?

Most of the time, this will translate into a simple database read. Developers answer this question through a concrete implementation of an `ApiXDataManager` class, which requires a method that resolves this.

> For more details, see `ApiXDataManager` and `ApiXDataManager.getAppKeyForApiKey`.

> For details on how to securely store API Keys on clients, see {@page Securely_Store_Keys_on_iOS_Android_and_Web_Applications.md _Securely Store Keys on iOS, Android, and Web Applications_ }.

## Request Authenticity and Integrity

Even if a request comes from a presumed authenticated application, it does not mean that the request is fully trusted by API-X yet. Each request has a unique signature that a client provides, and this unique signature is used by API-X to verify that:
1. The request indeed comes from the application that sends it;
2. The request has not been tampered with; and,
3. The request is not a replayed by an intermediate attacker.

A client uses a unique secret key to sign the request, using the request's data, and the server uses a similar process to verify that the signature is valid.

### Request Origin Verification

Only the application that possess the signing key can generate a valid signature. When the server authenticates the application, it also uses information from that application to verify the request signature. If a third-party attempts to send a request, the signature will not be valid and the request will be rejected by API-X.

### Request Integrity Verification

The signature is based on a HMAC SHA-256 hash that includes details of the request such as:
1. The endpoint of the request;
2. The date of the request;
3. The data in the body of the request;
4. Application-specific data; and,
5. A unique nonce.

If any of the details in the request were to change and the same signature would be sent, then API-X would reject it as the signature wouldn't match. This prevents tampering with the request itself.

### Request Replay Prevention

API-X invalidates each request signature after a single use to prevent relay attacks. If an attacker somehow gets a hold of the request and attempts to resend it with the same data to receive its response, API-X will reject it as the signature would have already been processed by the original request.

In addition, each request is accompanied by a date. This date is a UTC timestamp that represents the date in which a request was created. API-X takes steps to invalidate old requests. By default, any request older than 1 minute is rejected, however, this value is configurable.

However, it's also important that each legitimate request is serviced, therefore, a unique nonce value is included with each request. A Nonce is a randomly generated value and the client generates it and uses it in the computation of the signature, ensuring its uniqueness. Even two clients make a similar request at the same time, the nonce would be different, thus resulting in a different signature.

### Signing a Request

A client sends a signature using HTTP headers for security:

```
X-Signature: <unique signature>
X-Signature-Nonce: <nonce>
Date: <UTC Date / Timestamp>
```

> For details on how to securely store cryptographic keys on clients, see {@page Securely_Store_Keys_on_iOS_Android_and_Web_Applications.md _Securely Store Keys on iOS, Android, and Web Applications_ }.

## Access Control

API-X provides an access control mechanism that developers use to:
1. Determine which applications have access to what resources / endpoints; and,
2. Determine _how much_ access each application has to each resources.

This mechanism is called _Clearance Levels_. Clearance levels allow developers to specify the level of permission required to access each endpoint, as well as how much data each level of permission affords for a given endpoint.

To enable this mechanism, API-X asks 2 questions to developers:
1. What clearance level is required for your endpoint?
2. What clearance level does _this_ request has for _that_ endpoint?

The first is asked when creating the endpoint, providing fixed but concrete permission requirements for the endpoint. The second question is asked during the course of an ongoing request. This provides developers with flexibility to setup their own permission requirements per request, and integrate with industry standard authorization mechanisms like JSON Web Tokens (JWTs) and OAuth 2.0.

Clearance levels do _not_ replace JWTs, OAuth 2.0, OpenID Connect, nor any other of the industry standard mechanisms, but rather they can work together to provide clear permission expectations of your applications. API-X provides clear guidance and examples of which clearance level should be assigned to endpoints given the resources it grants access to, and how to assign clearance levels to requests considering aspects such as the nature of the resources, as well as the ownership relationship between requestor and data. API-X also provides examples on how to integrate clearance levels with JSON Web Tokens.

## Application Registration

API-X works to secure endpoints by working for Authorized applications only. However, the application registration is specific to the use of APIs. For example, APIs designed to be used only by the owners is a private API, and the process to register applications can be quite simple. However, public APIs (APIs that other developers can use for their own applications) require different registration process that must also be secured. It's imperative that secret keys are _never_ transmitted via a request, and as such, measures must be taken, such as using _Key Agreement Protocols_.

> For more details, see {@page Securely_Registering_New_Applications.md _Securely Registering New Applications_ }.

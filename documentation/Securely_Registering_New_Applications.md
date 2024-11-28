---
title: Securely Registering New Applications
category: API Security
---
# Securely Registering New Applications

API-X provides the foundation for building secure APIs with simplicity. However, application registration is still your responsibility. The process for registering new applications depends on your specific use case, so API-X offers guidance on how to register applications securely, but does not directly provide developer portals (web-based tools where developers can register, manage, and track the usage of their applications) in the core package.

## Application Registration Requirements

API-X requires only two pieces of data for each authorized application:

1. **API Key**: A unique key that an application sends with each request to authenticate itself to the server.
2. **Application Secure Key**: A unique secret key that the application uses to sign each request. This key is known to both the client and server but must _never_ be sent in any network request and must be stored securely.

> For more details on securely storing keys on clients, see [_Securely Store Keys on iOS, Android, and Web Applications_](./Securely_Store_Keys_on_iOS_Android_and_Web_Applications.md).

When a new application is registered, a new API Key and Application Secure Key must be issued.

## Private APIs

A private API is one where endpoints are only accessed by your proprietary client applications. These APIs are not meant for third-party access. For example, an API for a movie rating service that only your proprietary applications can access is considered a private API.

For these APIs, registration is usually simple and often does not require a developer portal. The most secure way to register applications is through _offline registration_.

Offline registration involves generating an API Key and Application Secure Key offline and using that information in your client application. If there are multiple developers working on the API and client applications, these keys can be shared in person.

If in-person transmission is not possible, use a secure end-to-end encrypted channel to share this information.

It's a good practice to rotate keys periodically, and it's recommended to use a unique set of keys for each application (e.g., one for the iOS client, one for the Android client, and one for the web application).

## Public APIs

Public APIs are designed to be accessible to authorized third-party applications. For example, an API that provides movie data for different developers to use in their own apps (e.g., an independent movie rating app).

Public APIs require a more robust registration process because:

1. Registration is typically done through a web portal.
2. More applications are registered, increasing the risk of attacks.

While it's generally acceptable to send API Keys over an encrypted network, the Application Secure Key must _never_ be sent over the network, even if encrypted by TLS. To register these applications, you should use a _Key Agreement Protocol_.

A Key Agreement Protocol allows both the server and client to independently generate a shared Application Secure Key without transmitting it. The server then associates the API Key with the generated Application Secure Key, and the client securely stores it to sign each request.

Some well-known Key Agreement Protocols are [Diffie-Hellman (DH)](https://en.wikipedia.org/wiki/Diffie–Hellman_key_exchange) and [Elliptic Curve Diffie-Hellman (ECDH)](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie–Hellman).


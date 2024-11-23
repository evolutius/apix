---
title: Securely Registering New Applications
category: API Security
---
API-X provides the foundation for building secure APIs with simplicity. However, application registration is still the developer's responsibility. Registering new applications entirely depend on the specific use case of the API, and therefore, API-X provides guidance on how to register new applications securely, but does not directly provide developer portals in the core package.

## Application Registration Requirements

From API-X's perspective, only two pieces of data are required per authorized application:

1. API Key: A unique key that an application sends with each request to authenticate itself to the server; and,
2. Application Secure Key: A unique secret key that the application uses to sign each request. This key is known to the client and server, but must _never_ be sent in any network request and must be stored securely.

> For more details on securely storing keys on clients, see _Securely Store Keys on iOS, Android, and Web Applications_.

When a new application is registered, and thus authorized, a new API Key and Application Secure Key must be issued.

## Private APIs

A private API is one with endpoints designed to only be reached by proprietary client applications, i.e., applications owned by the API owner. That is, the API endpoints are never meant to be reached by third parties. For example, an API for a movie rating service that can only be talked to by proprietary client applications is considered a private API.

For these APIs, registration is usually simple, and often does not require any elaborate system such as a developer portal. The simplest and most secure way to register applications is with _offline registration_.

Offline registration is when a developer generates an API Key and Application Secure Key offline, and simply uses that information for their client application. If there different developers working on the API endpoints and client applications, these keys can be transmitted in person.

If in-person transmition is not possible, then using a secure end-to-end encrypted channel to transmit this information is best.

In any case, it's a good practice to rotate keys every so often, and it's recommended that developers use a different set of keys for different applications, e.g., one for the iOS client, one for the Android client, and one for the web application.

## Public APIs

Public APIs contain endpoints that are meant to be accessible to authorized third-party applications. For example, an API that provides movie data for that different developers can use to build their own applications, e.g., a movie rating app independent of the API owner.

Public APIs require a more robust application registration process as:
1. Application registration is performed usually in a web portal; and,
2. There will be many more applications registered, and thus more opportunity for attacks to the endpoint.

While it's generally okay to send API Keys over an encrypted network, it is imperative that the Application Secure Key _never_ be sent over the network, even if it's encrypted by TLS. To register these applications, developers should use a _Key Agreement Protocol_.

A Key Agreement Protocol will tell both the server and client what are the rules to generate a new Application Secure Key, and they can independently generate it. The server will associate an API Key to the Application Secure Key, and the client will store it securely in their client application to be able to sign each request.

Some famous Key Agreement Protocols are [Diffie-Hellman (DH)](https://en.wikipedia.org/wiki/Diffie–Hellman_key_exchange), and [Elliptic Curve Diffie-Hellman (ECDH)](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie–Hellman).

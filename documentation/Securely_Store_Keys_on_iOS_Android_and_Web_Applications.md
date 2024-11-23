---
title: Securely Store Keys on iOS, Android, and Web Applications
category: API Security
---
In modern application development, ensuring that sensitive data such as API keys and application signing keys are securely stored is essential to prevent unauthorized access. This article provides best practices for securely storing keys on iOS, Android, and web applications.

## Storing Keys on iOS Applications

When developing iOS applications, developers should avoid hardcoding API keys or other sensitive data directly into the source code. Instead, they should take advantage of secure storage mechanisms available on the platform:

1. **Keychain Services**: Developers should use the iOS Keychain to store sensitive keys. The Keychain provides a secure way to store small pieces of data, such as passwords, API tokens, and cryptographic keys, and is designed to be resilient against reverse engineering attempts.

2. **Environment Variables**: For builds and configurations, developers can use environment variables that are injected during the build process. This prevents keys from being hardcoded in the source code.

3. **Obfuscation**: Developers should employ code obfuscation techniques to make reverse engineering more challenging. Tools like SwiftShield can be used to obfuscate strings and make it more difficult for attackers to locate sensitive keys.

## Storing Keys on Android Applications

Similar to iOS, Android developers should take care to avoid including sensitive keys directly in the source code. Instead, they should use the following methods:

1. **Android Keystore**: The Android Keystore system allows developers to store cryptographic keys in a container that makes it more difficult for malicious actors to extract them. The Keystore provides a secure storage location for keys, which can then be used for encryption or signing operations.

2. **Gradle Properties**: Developers can store sensitive information in `gradle.properties` and reference these properties in the code. This ensures that keys are not exposed in the version control system.

3. **ProGuard**: Developers should use ProGuard or R8 to obfuscate code and make it harder for attackers to decompile and reverse engineer the APK to extract sensitive information.

## Storing Keys on Web Applications

Storing keys securely on web applications presents a unique challenge because JavaScript running in a user's browser can be easily inspected. Developers must ensure that sensitive keys are not directly accessible in the client-side code. Consider the following best practices:

1. **Do Not Store Keys in Client-Side Code**: Developers should never store sensitive keys directly in JavaScript or any code that can be accessed through the browser. Any API key or secret should be kept server-side, and client-side applications should interact with a backend server that securely manages these keys.

2. **Environment Variables**: For environment-specific configuration, developers can use environment variables (e.g., `process.env.API_KEY`) and manage them during the build process. This ensures that keys are injected only during the build and are not exposed in the final, publicly accessible JavaScript code.

3. **Proxy API Calls**: Developers should implement a backend server to proxy API calls rather than having the client-side app communicate directly with third-party APIs. This approach ensures that keys remain on the server and never reach the user's browser.

## General Best Practices

1. **Minimize Exposure**: Developers should minimize the exposure of keys by keeping them only where they are absolutely needed and ensuring they are never logged or transmitted insecurely.

2. **Rotate Keys Regularly**: Keys should be rotated regularly, and access to old keys should be revoked to minimize the impact of a potential breach.

3. **Use Application Secrets Securely**: Developers should use environment-specific secrets for different environments (e.g., development, staging, production) to avoid using the same key across multiple environments.

4. **Monitor and Detect**: Developers should monitor for unauthorized use of their keys and set up alerts to detect suspicious activity, such as unexpected API usage.

## Conclusion

Storing keys securely is a critical part of application security. Developers working on iOS, Android, and web applications must leverage the secure storage mechanisms provided by each platform, avoid hardcoding sensitive information, and employ best practices to minimize the risk of exposing keys. By following these guidelines, developers can significantly reduce the likelihood of key theft and ensure the safety of their applications and users.

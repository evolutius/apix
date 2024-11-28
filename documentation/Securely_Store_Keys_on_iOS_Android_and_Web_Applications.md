---
title: Securely Store Keys on iOS, Android, and Web Applications
category: API Security
---
# Securely Store Keys on iOS, Android, and Web Applications

In modern application development, ensuring that sensitive data such as API keys and application signing keys are securely stored is essential to prevent unauthorized access. This guide provides best practices for securely storing keys on iOS, Android, and web applications.

## Storing Keys on iOS Applications

When developing iOS applications, avoid hardcoding API keys or other sensitive data directly into the source code. Instead, use secure storage mechanisms available on the platform:

1. **Keychain Services**: Use the iOS Keychain to store sensitive keys. The Keychain provides a secure way to store small pieces of data, such as passwords, API tokens, and cryptographic keys, and is designed to be resilient against reverse engineering.

2. **Environment Variables**: For builds and configurations, use environment variables that are injected during the build process. This prevents keys from being hardcoded in the source code. For example, you can set environment variables in your CI/CD pipeline to inject them at build time.

3. **Obfuscation**: Use code obfuscation techniques to make reverse engineering more challenging. Tools like [SwiftShield](https://github.com/rockbruno/swiftshield) can obfuscate strings and make it harder for attackers to locate sensitive keys.

## Storing Keys on Android Applications

Similar to iOS, avoid including sensitive keys directly in the source code when developing Android applications. Instead, use the following methods:

1. **Android Keystore**: Use the Android Keystore system to store cryptographic keys securely. The Keystore provides a container that makes it difficult for attackers to extract keys and allows you to use these keys for encryption or signing operations.

2. **Gradle Properties**: Store sensitive information in `gradle.properties` and reference these properties in your code. This ensures that keys are not exposed in version control. For example:

   ```gradle
   // gradle.properties
   API_KEY=your_api_key_here
   ```

   ```kotlin
   // Accessing the API key in code
   val apiKey = BuildConfig.API_KEY
   ```

3. **ProGuard**: Use [ProGuard](https://www.guardsquare.com/en/products/proguard) or [R8](https://developer.android.com/studio/build/shrink-code) to obfuscate your code, making it harder for attackers to decompile and reverse engineer the APK.

## Storing Keys on Web Applications

Storing keys securely in web applications is challenging because JavaScript running in a user's browser can be easily inspected. You must ensure that sensitive keys are not directly accessible in client-side code. Follow these best practices:

1. **Do Not Store Keys in Client-Side Code**: Never store sensitive keys directly in JavaScript or any code that can be accessed through the browser. Keep API keys or secrets on the server, and have client-side applications interact with a backend server that securely manages these keys.

2. **Environment Variables**: For environment-specific configuration, use environment variables (e.g., `process.env.API_KEY`) and inject them during the build process. This ensures that keys are only available during build time and not exposed in the final JavaScript code. For example, tools like [dotenv](https://github.com/motdotla/dotenv) can help manage environment variables.

3. **Proxy API Calls**: Implement a backend server to proxy API calls rather than having the client-side app communicate directly with third-party APIs. This ensures that keys remain on the server and are never exposed to the user's browser, reducing the risk of key exposure.

## General Best Practices

1. **Minimize Exposure**: Keep keys only where they are absolutely needed, and ensure they are never logged or transmitted insecurely.

2. **Rotate Keys Regularly**: Rotate keys regularly, and revoke access to old keys to minimize the impact of a potential breach.

3. **Use Environment-Specific Secrets**: Use environment-specific secrets for different environments (e.g., development, staging, production) to avoid using the same key across multiple environments.

4. **Monitor and Detect**: Monitor for unauthorized use of your keys and set up alerts to detect suspicious activity, such as unexpected API usage.

5. **Obfuscation is Not Enough**: Remember that obfuscation is not a foolproof security measure. Use it as an additional layer of defense along with secure storage practices.

## Conclusion

Storing keys securely is a critical part of application security. Whether you are developing iOS, Android, or web applications, leverage the secure storage mechanisms provided by each platform, avoid hardcoding sensitive information, and follow best practices to minimize the risk of exposing keys. By adhering to these guidelines, you can significantly reduce the likelihood of key theft and ensure the safety of your applications and users.


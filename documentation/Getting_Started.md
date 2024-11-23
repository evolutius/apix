---
title: Getting Started
category: Developer Documentation
---
Welcome to **API-X**! This guide will help you get up and running with API-X, a Node.js TypeScript package for building secure and scalable RESTful APIs quickly. API-X is built on top of [Express](https://expressjs.com/) and offers additional security and ease-of-use features, making it the perfect choice for secure API development.

## Prerequisites

Before you start, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher is recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) for dependency management
- [TypeScript](https://www.typescriptlang.org/) (v4 or higher)

To verify if you have Node.js and npm installed, run the following commands:

```sh
node -v
npm -v
```

If you prefer yarn, verify its installation with:

```sh
yarn -v
```

## Installing API-X

To install API-X in your project, first add the `@evolutius` npm registry by running the following command:

```sh
echo "@evolutius:registry=https://npm.pkg.github.com/" >> .npmrc
```

Followed by:
```sh
npm install @evolutius/apix
```

Or if you're using yarn:

```sh
yarn add @evolutius/apix
```

This will install API-X along with all necessary dependencies.

## Creating Your First API-X Project

Let's create a simple API to demonstrate how easy it is to use API-X.

### Step 1: Set Up Your Project

First, create a new directory for your project and initialize it:

```sh
mkdir my-apix-api
cd my-apix-api
npm init -y
```

Next, add TypeScript support to your project:

```sh
npm install typescript --save-dev
npx tsc --init
```

Ensure you've installed all dependencies:

```sh
npm install --save-dev @evolutius/apix express @types/express
```

### Step 2: Create Your Server

Now, let's create a simple server using API-X. Create a new file named `server.ts` in your project root directory:

```typescript
import {
  ApiXManager,
  ApiXMethod,
  ApiXMethodCharacteristic,
  ApiXDataManager,
  ApiXAccessLevelEvaluator,
  ApiXRedisStore,
  ApiXConfig,
  ApiXAccessLevel,
  ApiXRequestInputSchema
} from '@evolutius/apix';

import { Request } from 'express';
  
const helloWorldMethod: ApiXMethod = {
  entity: 'hello',
  method: 'world',
  characteristics: new Set([ApiXMethodCharacteristic.PublicUnownedData]),
  requestHandler: (req, res) => {
    return {
      success: true,
      message: 'Hello, world!'
    }
  }
}

class DataManager implements ApiXDataManager {
  getAppKeyForApiKey(apiKey: string): string | Promise<string> | null {
    /// single app has access
    return apiKey === process.env.API_KEY ? process.env.APP_KEY! : null;
  }
}

class AccessLevelEvaluator implements ApiXAccessLevelEvaluator {
  evaluate<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    appMethod: ApiXMethod<QuerySchema, BodySchema>,
    req: Request
  ): ApiXAccessLevel | Promise<ApiXAccessLevel> {
    // For access control. This is the lowest level that has access.
    return ApiXAccessLevel.PublicRequestor;
  }
}

const config = new ApiXConfig();

/// If using redis, use ApiX implementation. Otherwise you can implement
/// you own by implementing the `ApiXCache` interface.
const cache = new ApiXRedisStore(/* redis server, if not local */);

const manager = new ApiXManager(
  new AccessLevelEvaluator(),
  new DataManager(),
  config,
  cache
);

/// Must only be used during development.
/// Disables some security features for easy testing
manager.developerModeEnabled = true;

manager.registerAppMethod(helloWorldMethod);

/// Run the server
manager.start();
```

In this example:

- We import API-X types and interfaces.
- We create a `GET` endpoint accessible at `/hello/world`.
- We implement the various interfaces required by the manager.
- We create a manager and set it to development mode.
- Finally, we start the manager. The default port is 3000.

## Running the Project

To compile and run your TypeScript project, add the following script to your `package.json`:

```json
"scripts": {
  "build": "tsc",
  "start": "npm run build && node dist/server.js"
}
```

Compile your TypeScript code:

```sh
npm run build
```

Then start your server:

```sh
npm run start
```

Use `curl` or a similar tool to create a request:

```sh
curl -X GET "http://localhost:3000/hello/world" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <YOUR_API_KEY>" \
  -H "X-Signature: AnySignature" \
  -H "X-Signature-Nonce: AnyNonce" \
  -H "Date: $(date -u +"%a, %d %b %Y %H:%M:%S GMT")"
```

Make sure to replace `<YOUR_API_KEY>` with the same key used in the server accessible via `process.env.API_KEY`.

Note that because developement mode is enabled, `HTTPS` is not required, and the `X-Signature` and `X-Signature-Nonce` headers are set to any arbitrary value and the request will still work.

And the response JSON should be:
```
{
  "success": true,
  "message": "Hello, world!"
}
```

## Next Steps

You’ve just created your first secure API using API-X! Here are some ideas for what you could do next:

1. **Explore API-X Features**: Learn more about security, request signing, access levels, and other features provided by API-X. See [_API-X Security and Access Control_](./API_X_Security_and_Access_Control.md).
2. **Add More Endpoints**: Start building out your API with more endpoints, each protected with the appropriate security. See [_Implementing API-X Endpoints_](./Implementing_API_X_Endpoints.md).
3. **Read the Documentation**: Dive deeper into API-X’s functionality and features by checking the full documentation.

Happy coding!

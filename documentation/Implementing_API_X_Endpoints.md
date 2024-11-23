---
title: Implementing API-X Endpoints
category: Developer Documentation
group: Working with HTTP Endpoints
---
API-X Endpoints are routes that handle an operation of an HTTP RESTful API, such a getting users data, creating a new post, among others.

## API-X Method Interface

```ts
export interface ApiXMethod<
  QuerySchema extends ApiXRequestInputSchema = Record<string, never>,
  BodySchema extends ApiXRequestInputSchema = Record<string, never>
> {
  readonly entity?: string;
  readonly method: string;
  readonly requestHandler: ApiXRequestHandler<QuerySchema, BodySchema>;
  readonly httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL';
  readonly queryParameters?: ReadonlyArray<ApiXUrlQueryParameter<unknown>>;
  readonly jsonBodyValidator?: ApiXHttpBodyValidator<BodySchema>;
  readonly jsonBodyRequired?: boolean;
  readonly characteristics: ReadonlySet<ApiXMethodCharacteristic>;
}
```

### Overview

The `ApiXMethod` interface is used to define a route or endpoint for your HTTP RESTful API. Generally speaking, methods should be designed with the following key principles in mind:
1. An endpoint should be scoped; developers should not have multiple operations under the same endpoint and should avoid complicating the handling logic.
2. Endpoints should have clear access expectations; only requestors with access should ever even reach an entry point for the method.
   - The method must handle resource scoping (more on this later).
3. Any input data (URL query parameters or HTTP Body) is validated and processed _before_ handling a request.
4. Any input data should have a clear shape and presence expectations _during_ the handling of the request.

### Defining an Endpoint

There are two properties that define the endpoint, `entity`, and `method`. _Entity_ is used to define a scope for your endpoint, e.g. `users` or `posts`, whereas _Method_ defines an operation within the scope, e.g. `create`, `delete`, or `update`. Entities are optional, however, and so developers can define their endpoints how they see fit. The resulting endpoint is:
- `/<endpoint>/<method>`, if `entity` is a non-empty string; or,
- `/<method>`, if there's no entity.

To choose appropriate entites and method names, one can think of two questions:
1. What is the operation being applied to?
   - This defines the `entity`.
2. What operation is being applied?
   - This defines the `method`.

For example, an operation to create a new post entry can have an entity of `posts` and method of `create` or `new`.

However, when getting specific resources, developers can also use parameterized methods, e.g.:
- `/users/:id`, where `entity` is `users` and `method` is `:id`. This method will match requests such as `/user/01234567`, which is typical when getting data for a user with a given ID.

### URL Query Parameters

The `ApiXMethod` interface uses templates to allow the definition of the shape of input URL query parameters. Generally speaking, there are two steps that need to be taken:
1. Define input shape of the URL Query parameters; and,
2. Define each parameter.

An interface is used to define the schema of the URL parameters:

```ts
interface SearchPostsSchema extends ApiXRequestInputSchema {
  readonly searchTerm: string;  /// Search term to use
  readonly sortBy?: PostKey;  /// A key to sort by
  readonly authorName?: string;  /// An author for the posts
  readonly dateRange: [Date, Date];  /// The date range of the post.
  readonly tags?: ReadonlyArray<string>;  /// A list of tags the post must contain
}
```

The schema definition must extend the `ApiXRequestInputSchema` interface. With this, we define that when the endpoint receives a request, only these URL query parameters will be used. Furthermore, only `searchTerm` is required, and additional parameters are optional.

In addition to defining the schema, the parameters are defined using the `queryParameters` array of `ApiXMethod`. In said definition, developers can specify a validator and processor objects. These objects will do exactly as their name implies, validate and process query parameters.

As an example, let's write a validator and processor for the `tags` query parameter:

```ts
/**
 * A validator object that succeeds for correctly defined comma-separated
 * arrays for URL parameters. Example:
 * `/entity/endpoint?array=value0,value1,value2,value3`
 */
class CommaSeparatedArrayUrlQueryParameterValidator implements ApiXUrlQueryParameterValidator {

  isValid(name: string, value: string): boolean {
    /// Matches only alphanumeric, case-insensitive, comma-separated values
    const regex = /^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/;
    return regex.test(value);
  }
}
```

This validator uses a simple regular expression pattern to validate that the value is an alphanumeric case-insensitve comma-separated list of strings. This will suffice for a list of tags. Now, a processor can be implemented:

```ts
/**
 * A processor object that converts a valid list of comma-separated values
 * to a readonly array.
 */
class CommaSeparatedArrayUrlQueryParameterProcessor implements ApiXUrlQueryParameterProcessor<ReadyonlyArray<string>> {

  process(name: string, value: string): [string, ReadonlyArray<string>] {
    return [name, value.split(',')];
  }
}
```

First thing to note is that the `ApiXUrlQueryParameterProcessor` is a templated interface that returns a key-value tuple, where the value can have any type. This makes it useful to define parameters in the Schema having any type desired and the processor handles the conversion into the type. In this case, the parameter value would a string such as `'value0,value1,value2'`, but the output of the processor is a `ReadonlyArray<string>`, namely `['value0', 'value1', value2']`, which matches the type of the `tags` property in the `SearchPostsSchema` interface.

Additionally, a processor may decide to process the name of the parameter so that developers have the additional flexibility of allowing users to specify URL query parameters using one convention, e.g., `/entity/method/snake_case=some_value`, but the schema may receive the property as `snakeCase` instead by modifying it in the processor.

Finally, with a validator and processor implemented, the parameters can be defined in the method:

```ts
const searchPostsMethod: ApiXMethod<SearchPostsSchema> = {
  entity: 'posts',
  method: 'search',
  queryParameters: [
    /* the processor will convert `search_query` into `searchTerm` */
    new ApiXUrlQueryParameter('search_query', someValidator, someProcessor, true /* required */),
    new ApiXUrlQueryParameter('sort_by', someValidator, someProcessor, /* not required */),
    new ApiXUrlQueryParameter('author', someValidator, someProcessor, /* not required */),
    new ApiXUrlQueryParameter('date_range', someValidator, someProcessor, /* not required */),
    new ApiXUrlQueryParameter('tags', new CommaSeparatedArrayUrlQueryParameterValidator(), new CommaSeparatedArrayUrlQueryParameterProcessor(), /* not required */),
  ],
  requestHandler: (req, res) => {
    /* `req` has an implicit type of `ApiXRequestHandler<SearchPostsSchema> */
    const queryParameters = req.queryParameters;

    /* Now each parameter in the `queryParameters` object is fully validated
    and processed to be in its optional form */
    if (queryParameters.tags && queryParameter.tags.length > 0) {
      /// do something with the tags array
    }

    return someJsonObject;
  }
}
```

_Note: if a validator object fails, the request will immediately fail and an unsuccessful response will be returned._

### Validating HTTP JSON Body

The `ApiXMethod` interface's second template parameter is used to define the schema of the JSON body in a similar fashion than it's done for the URL queries.

```ts
interface Post {
  readonly id: string;
  readonly content: string;
  readonly authorId: string;
}

interface CreatePostRequestSchema extends ApiXRequestInputSchema {
  readonly post: Post;
  readonly tags?: ReadonlyArray<string>;
}
```

In this case, the schema to be used is `CreatePostRequestSchema`. A _validator_ can then be used to ensure each post is valid:

```ts
class CreatePostRequestValidator implements ApiXHttpBodyValidator<CreatePostRequestSchema> {
  isValid(body: CreatePostRequestSchema): boolean {
    /// validate post here. Returning false means
    /// the body is not valid and is the request is rejected.
    return true;
  }
} 
```

Finally, then the method can be defined:

```ts
const createPostMethod: ApiXMethod<Record<string, never>, CreatePostRequestSchema> = {
  entity: 'posts',
  method: 'new',
  jsonBodyRequired: true,  /// This endpoint requires that the body be present,
  jsonBodyValidator: new CreatePostRequestValidator(),
  requestHandler: (req, res) => {
    /* `req` has an implicit type of `ApiXRequestHandler<Record<string, never>, CreatePostRequestSchema> */
    /// jsonBody is of type `CreatePostRequestSchema`

    /// Since `jsonBodyRequired` is `true`, it's guaranteed
    /// that this will have a value.
    const jsonBody = req.jsonBody!;
    const response = await newPost(jsonBody.post, ...);
    
    return someJsonObject;
  }
}
```

_Note: since this method doesn't require URL Query parameters, that template is set to `Record<string, never>` and it will not be present._

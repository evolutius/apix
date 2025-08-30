/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This module provides a declarative way to define endpoints on a class.
 */

import type { Response as ExpressResponse } from 'express';
import type { Request } from '../Request';
import type { Response } from '../Response';
import type { UrlQueryParameter } from './UrlQueryParameter';
import type { HttpBodyValidator } from './HttpBodyValidator';
import { MethodCharacteristic } from './MethodCharacteristic';
import type { EndpointMethod, HttpMethod } from './EndpointMethod';
import { RequestInputSchema } from './RequestInputSchema';
import { TypeUtil } from '../utils/TypeUtil';

type AnyRequest = Request<any, any>;
type AnyHandler = (req: AnyRequest, res: ExpressResponse) => Response | Promise<Response>;

/** Internal: metadata shape per method */
interface MethodMeta {
  name: string | symbol;
  // Route
  route?: { methodName: string; httpMethod: HttpMethod };
  // Access control flags
  hasPrivateResource?: boolean;
  hasPublicResource?: boolean;
  explicitCharacteristics: Set<MethodCharacteristic>;
  methodAuthRequired?: boolean;
  // Input schema
  queryParams?: ReadonlyArray<UrlQueryParameter<unknown>>;
  jsonBodyValidator?: HttpBodyValidator<any>;
  jsonBodyRequired?: boolean;
  // Owner evaluator marker (only the name is stored in ClassMeta)
  isOwnerEvaluator?: boolean;
}

/** Internal: metadata per class (constructor) */
interface ClassMeta {
  entityParam?: string | null | undefined;
  classAuthRequired?: boolean;
  ownerEvaluatorName?: string | symbol;
  methods: Map<string | symbol, MethodMeta>;
}

/** Weak maps for metadata (no memory leaks) */
const classMeta = new WeakMap<Function, ClassMeta>();

/** Defensive assertion helper */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[API-X Decorators] ${message}`);
  }
}

/** Convert PascalCase/CamelCase to kebab-case */
function toKebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Get or create class-level metadata container */
function ensureClassMeta(ctor: Function): ClassMeta {
  let meta = classMeta.get(ctor);
  if (!meta) {
    meta = { methods: new Map() };
    classMeta.set(ctor, meta);
  }
  return meta;
}

/** Get or create method-level metadata container */
function ensureMethodMeta(ctor: Function, name: string | symbol): MethodMeta {
  const classMetadata = ensureClassMeta(ctor);
  let methodMetadata = classMetadata.methods.get(name);
  if (!methodMetadata) {
    methodMetadata = { name, explicitCharacteristics: new Set<MethodCharacteristic>() };
    classMetadata.methods.set(name, methodMetadata);
  }
  return methodMetadata;
}

/**
 * Marks a method as the owner evaluator for this endpoint class.
 *
 * The evaluator determines whether the requestor owns the resource targeted by a route.
 * It must have signature: (request: Request<any, any>) => boolean | Promise<boolean>
 *
 * Exactly one method per class should be decorated when ownership is required.
 */
export function OwnerEvaluator() {
  return function (_value: Function, context: ClassMethodDecoratorContext) {
    assert(context.kind === 'method', '@OwnerEvaluator can only be applied to methods.');
    const methodName = context.name;

    context.addInitializer(function () {
      const classMetadata = ensureClassMeta((this as any).constructor);
      assert(
        !classMetadata.ownerEvaluatorName || classMetadata.ownerEvaluatorName === methodName,
        `Multiple @OwnerEvaluator methods found (existing: ${String(classMetadata.ownerEvaluatorName)}, new: ${String(methodName)}).`
      );
      classMetadata.ownerEvaluatorName = methodName;
      const methodMetadata = ensureMethodMeta((this as any).constructor, methodName);
      methodMetadata.isOwnerEvaluator = true;
    });
  };
}

/**
 * Declares the route for a handler method.
 *
 * @param methodName The method segment (e.g., ":id", "new", etc.).
 * @param httpMethod The HTTP verb (default "GET").
 */
export function Route(methodName: string, httpMethod: HttpMethod = 'GET') {
  return function (_value: Function, context: ClassMethodDecoratorContext) {
    assert(context.kind === 'method', '@Route can only be applied to methods.');
    assert(TypeUtil.isString(methodName), '@Route(methodName) requires a string.');

    context.addInitializer(function () {
      const methodMetadata = ensureMethodMeta((this as any).constructor, context.name);
      assert(!methodMetadata.route, `Duplicate @Route on method ${String(context.name)}.`);
      methodMetadata.route = { methodName, httpMethod };
    });
  };
}

/**
 * Marks a method or class as requiring authentication. A method marker with this decorator
 * is only accessible to requestors designated to have an access level of `AuthenticatedRequest`
 * or higher.
 *
 * Class-level usage applies to all routes unless overridden by method-level decisions.
 */
export function AuthRequired() {
  return function (_value: any, context: ClassDecoratorContext | ClassMethodDecoratorContext) {
    // Method-level
    if ((context as ClassMethodDecoratorContext).kind === 'method') {
      const methodContext = context as ClassMethodDecoratorContext;
      methodContext.addInitializer(function () {
        const methodMetadata = ensureMethodMeta((this as any).constructor, methodContext.name);
        methodMetadata.methodAuthRequired = true;
      });
      return;
    }
    // Class-level
    const classContext = context as ClassDecoratorContext;
    classContext.addInitializer(function () {
      const classMetadata = ensureClassMeta(this as any);
      classMetadata.classAuthRequired = true;
    });
  };
}

/**
 * Marks a method as operating on resources that can only be accessed by
 * internal users. The requestor must have an access level of `Admin`.
 */
export function InternalResource() {
  return methodCharacteristic(MethodCharacteristic.Internal);
}

/**
 * Marks a method as operating on resources that can only be accessed by
 * moderators. The requestor must have an access level of `Moderator` or
 * higher.
 */
export function ModerativeResource() {
  return methodCharacteristic(MethodCharacteristic.Moderative);
}

/**
 * Marks a method as operating on resources that can only be accessed by
 * employees at an institution. The requestor must have an access level
 * of `Manager` or higher.
 */
export function InstitutionalResource() {
  return methodCharacteristic(MethodCharacteristic.Institutional);
}

/**
 * Marks a method as operating on resources that can only be accessed by
 * special users (i.e. beta testers). The requestor must have an access level
 * of `PrivilegedRequestor` or higher.
 */
export function ExclusiveResource() {
  return methodCharacteristic(MethodCharacteristic.Special);
}

/**
 * Marks a route as operating on privately owned resources.
 * The requestor must have an access level of `ResourceOwner` or higher.
 *
 * Promises that a method has at least some private resource to serve or access,
 * if owner requests it, or a higher-level requestor (i.e., admin).
 */
export function PrivateResource() {
  return function (_value: Function, context: ClassMethodDecoratorContext) {
    assert(context.kind === 'method', '@PrivateResource can only be applied to methods.');
    context.addInitializer(function () {
      const methodMetadata = ensureMethodMeta((this as any).constructor, context.name);
      methodMetadata.hasPrivateResource = true;
    });
  };
}

/**
 * Marks a route as operating on publicly accessible resources.
 * The requestor must have an access level of `AuthenticatedRequestor` (if
 * `AuthRequired` is applied), or `PublicRequestor` (if not).
 *
 * Promises that a method has at least some public resource to serve or access.
 */
export function PublicResource() {
  return function (_value: Function, context: ClassMethodDecoratorContext) {
    assert(context.kind === 'method', '@PublicResource can only be applied to methods.');
    context.addInitializer(function () {
      const methodMetadata = ensureMethodMeta((this as any).constructor, context.name);
      methodMetadata.hasPublicResource = true;
    });
  };
}

/** Helper for explicit MethodCharacteristic decorators */
function methodCharacteristic(char: MethodCharacteristic) {
  return function (_value: Function, context: ClassMethodDecoratorContext) {
    assert(context.kind === 'method', 'This decorator can only be applied to methods.');
    context.addInitializer(function () {
      const methodMetadata = ensureMethodMeta((this as any).constructor, context.name);
      methodMetadata.explicitCharacteristics.add(char);
    });
  };
}

/**
 * Declares an HTTP JSON body validator for a route and whether it is required.
 *
 * @param validator A validator instance. If undefined, only `isRequired` will be set.
 * @param isRequired Whether a JSON body must be present. Defaults to undefined.
 */
export function HttpBody<TSchema extends RequestInputSchema>(
  validator?: HttpBodyValidator<TSchema>,
  isRequired?: boolean
) {
  return function (_value: Function, context: ClassMethodDecoratorContext) {
    assert(context.kind === 'method', '@HttpBody can only be applied to methods.');
    context.addInitializer(function () {
      const methodMetadata = ensureMethodMeta((this as any).constructor, context.name);
      if (validator) {
        methodMetadata.jsonBodyValidator = validator as HttpBodyValidator<any>;
      }
      if (isRequired !== undefined) {
        methodMetadata.jsonBodyRequired = isRequired;
      }
    });
  };
}

/**
 * Declares the query parameters for a route.
 *
 * @param params A readonly array of UrlQueryParameter descriptors.
 */
export function QueryParameters(params: ReadonlyArray<UrlQueryParameter<unknown>>) {
  return function (_value: Function, context: ClassMethodDecoratorContext) {
    assert(context.kind === 'method', '@QueryParameters can only be applied to methods.');
    assert(Array.isArray(params), '@QueryParameters expects an array.');
    context.addInitializer(function () {
      const methodMetadata = ensureMethodMeta((this as any).constructor, context.name);
      methodMetadata.queryParams = params;
    });
  };
}

/**
 * A class decorator that designates any class as an API endpoint generator / provider.
 *
 * @param entity If undefined → kebab-case(className); if null → entity omitted; else exact string used.
 */
export function EndpointGenerator(entity?: string | null) {
  return function <T extends { new (...args: any[]): any }>(value: T, context: ClassDecoratorContext) {
    // Persist entity decision on the class
    context.addInitializer(function () {
      const classMetadata = ensureClassMeta(this as any);
      classMetadata.entityParam = entity;
    });

    return value;
  };
}

/**
 * Build EndpointMethod objects for a decorated instance.
 * Validates invariants and binds methods safely.
 */
function buildEndpointsForInstance(
  instance: any,
  ctor: Function
): ReadonlyArray<EndpointMethod<any, any>> {
  const classMetadata = ensureClassMeta(ctor);
  const entityValue = resolveEntity(ctor, classMetadata.entityParam);

  const endpoints: EndpointMethod<any, any>[] = [];

  for (const [, methodMetadata] of classMetadata.methods) {
    // Skip plain methods (no @Route)
    if (!methodMetadata.route) {
      continue;
    }

    assert(
      !methodMetadata.isOwnerEvaluator,
      `@OwnerEvaluator method "${String(methodMetadata.name)}" must not also be decorated with @Route.`
    );

    // Determine characteristics for this route
    const characteristics = new Set<MethodCharacteristic>(methodMetadata.explicitCharacteristics);
    const authApplies = !!(methodMetadata.methodAuthRequired || classMetadata.classAuthRequired);

    if (methodMetadata.hasPrivateResource) {
      characteristics.add(MethodCharacteristic.PrivateOwnedData);
    }

    if (methodMetadata.hasPublicResource) {
      characteristics.add(
        authApplies ? MethodCharacteristic.PublicOwnedData : MethodCharacteristic.PublicUnownedData
      );
    }

    assert(
      characteristics.size > 0,
      `Route "${String(methodMetadata.name)}" must declare at least one resource/characteristic decorator.`
    );

    // Check ownership rule: required if private OR public+auth
    const needsOwnerEval = !!(methodMetadata.hasPrivateResource || (methodMetadata.hasPublicResource && authApplies));
    let ownerEval: ((req: AnyRequest) => boolean | Promise<boolean>) | undefined;

    if (needsOwnerEval) {
      assert(
        classMetadata.ownerEvaluatorName !== undefined,
        `Route "${String(methodMetadata.name)}" requires @OwnerEvaluator on exactly one method in class ${ctor.name}.`
      );
      const fn = instance[classMetadata.ownerEvaluatorName as any];
      assert(
        TypeUtil.isFunction(fn),
        `@OwnerEvaluator method "${String(classMetadata.ownerEvaluatorName)}" not found or not a function.`
      );
      ownerEval = (req: AnyRequest) => fn.call(instance, req);
    }

    // Bind the request handler to the instance to preserve `this` in user code
    const original = instance[methodMetadata.name as any] as AnyHandler;
    assert(TypeUtil.isFunction(original), `Handler method "${String(methodMetadata.name)}" is not a function.`);

    const handler: AnyHandler = (req, res) => original.call(instance, req, res);

    // Compose EndpointMethod
    const endpoint: EndpointMethod<any, any> = {
      entity: entityValue,
      method: methodMetadata.route.methodName,
      httpMethod: methodMetadata.route.httpMethod,
      requestHandler: handler,
      characteristics: new Set(characteristics),
      ...(methodMetadata.queryParams ? { queryParameters: methodMetadata.queryParams } : {}),
      ...(methodMetadata.jsonBodyValidator ? { jsonBodyValidator: methodMetadata.jsonBodyValidator } : {}),
      ...(methodMetadata.jsonBodyRequired !== undefined ? { jsonBodyRequired: methodMetadata.jsonBodyRequired } : {}),
      ...(ownerEval ? { requestorOwnsResource: ownerEval } : {})
    };

    // Optional: sanity guard — GET endpoints should not *require* body.
    if (endpoint.httpMethod === 'GET' && endpoint.jsonBodyRequired) {
      throw new Error(
        `[API-X Decorators] GET route "${endpoint.method}" cannot require a JSON body.`
      );
    }

    // Freeze the endpoint object to discourage accidental mutation after registration
    Object.freeze(endpoint);
    endpoints.push(endpoint);
  }

  // Stable order: by method string then http verb for determinism
  endpoints.sort((a, b) => {
    if (a.method === b.method) return (a.httpMethod || 'GET').localeCompare(b.httpMethod || 'GET');
    return a.method.localeCompare(b.method);
  });

  return endpoints as ReadonlyArray<EndpointMethod<any, any>>;
}

/** Resolve the final entity string or undefined (when null provided) */
function resolveEntity(ctor: Function, param: string | null | undefined): string | undefined {
  if (param === null) {
    return undefined;
  }

  if (TypeUtil.isString(param) && param.trim().length > 0) {
    return param;
  }

  // undefined → kebab-case of class name
  const name = ctor.name || 'endpoint';
  return toKebabCase(name);
}

/**
 * A base class for generating endpoint methods.
 *
 * You can extend this class to create endpoint generators with helper methods,
 * such as `generate` and `getEndpointMethod`.
 * 
 * @example
 * ```ts
 * class MyEndpointGenerator extends BaseEndpointGenerator {
 *   // Custom methods and properties
 * }
 *
 * const generator = new MyEndpointGenerator();
 * const methods = generator.generate();
 * // TODO: Use the generated methods
 * ```
 */
export class BaseEndpointGenerator {

  /**
   * Retrieves a specific endpoint method by its name and HTTP method.
   * @param method The name of the endpoint method.
   * @param httpMethod The HTTP method of the endpoint.
   * @returns The matching endpoint method or undefined if not found.
   */
  public getEndpointMethod<
    Q extends RequestInputSchema = Record<string, never>,
    B extends RequestInputSchema = Record<string, never>
  >(
    method: string,
    httpMethod: HttpMethod = 'GET'
  ): EndpointMethod<Q, B> | undefined {
    const endpoints = this.generate();
    return endpoints.find(ep => ep.method === method && ep.httpMethod === httpMethod);
  }

  /**
   * Generates endpoint methods for the current instance.
   * @returns An array of generated endpoint methods.
   */
  public generate(): ReadonlyArray<EndpointMethod<any, any>> {
    const ctor = (this as any).constructor as Function;
    return buildEndpointsForInstance(this, ctor);
  }
}

/** A method to retrieve generated endpoints from an instance. */
export function getGeneratedEndpoints(instance: object): ReadonlyArray<EndpointMethod<any, any>> {
  const ctor = (instance as any).constructor as Function;
  return buildEndpointsForInstance(instance, ctor);
}

/**
 * Checks if an object is a valid endpoint generator. A valid endpoint generator
 * will be probably decorated with @EndpointGenerator, have at least one route,
 * and implement the necessary methods (i.e. an owner evaluator, if needed).
 * 
 * @param instance The object to check.
 * @returns True if the object is a valid endpoint generator, false otherwise.
 */
export function isValidEndpointGenerator(instance: object): boolean {
  const ctor = (instance as any).constructor as Function;
  const classMetadata = classMeta.get(ctor);
  if (!classMetadata) {
    return false;
  }
  const methods = new Array(...classMetadata.methods.values());
  const requiresOwnerEvaluator = methods.some(
    m => m.hasPrivateResource === true
      || (m.hasPublicResource === true
          && (m.methodAuthRequired === true || classMetadata.classAuthRequired === true)));
  const routes = methods.filter(m => m.route !== undefined);
  return routes.length > 0 && (!requiresOwnerEvaluator || !!classMetadata.ownerEvaluatorName);
}

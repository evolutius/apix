import {
  ApiXConfig,
  ApiXConfigKey
} from './ApiXConfig';
import {
  ApiXResponseErrorId,
  errorMessages
} from './common/ApiXError';
import {
  MetricManager,
  MetricManagerOptions,
  MetricTags
} from './common/MetricManager'
import {
  Request,
  Response
} from 'express';
import { ApiXAccessLevel } from './common/ApiXAccessLevel';
import { ApiXAccessLevelEvaluator } from './common/ApiXAccessLevelEvaluator';
import { ApiXCache } from './common/ApiXCache';
import { ApiXDataManager } from './ApiXDataManager';
import { ApiXHttpHeaders } from './common/ApiXHttpHeaders';
import { ApiXInputUrlQueryParameterProcessor } from './common/methods/ApiXInputUrlQueryParameterProcessor';
import { ApiXJsonDictionary } from './common/ApiXJsonDictionary';
import { ApiXMethod } from './common/methods/ApiXMethod';
import { ApiXMethodCharacteristic } from './common/methods/ApiXMethodCharacteristic';
import { ApiXRequestInputSchema } from './common/methods/ApiXRequestInputSchema';
import { Logger } from './common/Logger';
import { apiXRequest } from './common/ApiXRequest';
import bodyParser from 'body-parser';
import { createHmac } from 'crypto';
import express from 'express';
import { makeApiXErrorResponse } from './common/utils/makeApiXErrorResponse';
import path from 'path';

/**
 * Type used to define an express handler as used in API-X.
 */
type ExpressHandler = (req: Request, res: Response) => Promise<void>;

enum MetricName {
  SuccessfulRequest = 'SuccessfulRequest',
  RejectedRequest = 'RejectedRequest',
  HttpStatusCode = 'HttpStatusCode',
  RequestTime = 'RequestTime'
}

enum RequestRejectionReason {
  UnauthorizedApp = 'UnauthorizedApp',
  MissingRequiredHeaders = 'MissingRequiredHeaders',
  InvalidRequest = 'InvalidRequest',
  UrlParametersVerificationError = 'UrlParametersVerificationError',
  MissingRequiredJsonBody = 'MissingRequiredJsonBody',
  InvalidJsonBody = 'InvalidJsonBody',
  UnauthorizedRequest = 'UnauthorizedRequest'
}

/**
 * A manager class that handles incoming connections and routing.
 * Request body and method response is always assumed to be JSON.
 * 
 * {@label MANAGER}
 * 
 * @category Building HTTP RESTful APIs
 */
export class ApiXManager {
  private app;
  private appConfig: ApiXConfig;
  private accessLevelEvaluator: ApiXAccessLevelEvaluator;
  private dataManager: ApiXDataManager;
  private appCache: ApiXCache;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registeredMethods: Record<string, ApiXMethod<any, any>>;
  private logger?: Logger;
  private metricManager?: MetricManager;
  private metricManagerOptions?: MetricManagerOptions;

  /**
   * A Boolean value that determines whether developer mode is enabled.
   * 
   * When developer mode is enabled, certain features are disabled to
   * facilite testing. Developer mode must _never_ be used on a
   * production server.
   * 
   * When developer mode is enabled, the following requirements are
   * removed:
   * - HTTPS/TLS enforcement.
   * - Request signature, integrity, and age validation.
   */
  public developerModeEnabled = false;

  /**
   * Constructor
   * @param {ApiXAccessLevelEvaluator} evaluator An evaluator to perform access control.
   * @param {ApiXDataManager} dataManager An object that manages date for consumption by the API.
   * @param {ApiXConfig} appConfig An object with the configuration of the API.
   * @param {ApiXCache} appCache A cache used for the API.
   */
  public constructor(
      evaluator: ApiXAccessLevelEvaluator,
      dataManager: ApiXDataManager,
      appConfig: ApiXConfig,
      appCache: ApiXCache,
      logger?: Logger
  ) {
    this.app = express();
    this.appConfig = appConfig;
    this.accessLevelEvaluator = evaluator;
    this.dataManager = dataManager;
    this.appCache = appCache;
    this.logger = logger;
    this.registeredMethods = {};

    /// TLS / SSL enforcement
    this.app.use(bodyParser.json());
    const self = this;
    this.app.use((req, res, next) => {
      if (self.developerModeEnabled || req.secure || req.header(ApiXHttpHeaders.ForwardedProto) === 'https') {
        next();
      } else {
        // Request was not made over HTTPS
        res.status(403).send(this.makeErrorResponse('insecureProtocol'));
      }
    });
  }

  /**
   * Starts the API service.
   */
  public start() {
    if (Object.keys(this.registeredMethods).length === 0) {
      throw new Error('No method has been registered');
    }
    
    const port = this.appConfig.valueForKey<number>(ApiXConfigKey.Port);
    if (!port) {
      throw new Error('No port specified in API configuration');
    }

    const host = this.appConfig.valueForKey<string>(ApiXConfigKey.Host) || '127.0.0.1';
    
    const self = this;
    this.app.listen(port, host, () => {
      self.logger?.info(`Listening on port ${host}:${port}`);
      if (self.developerModeEnabled) {
        self.logger?.warn(`Developer Mode is enabled which decreases security. Make sure this is disabled in a production environment.`);
      }
    });
  }

  /**
   * Sets a metric manager for metric emit.
   * @param {MetricManager} manager The metric manager object.
   * @param {MetricManagerOptions} options The options when emitting metrics.
   */
  public setMetricManager(manager: MetricManager, options?: MetricManagerOptions) {
    this.metricManager = manager;
    this.metricManagerOptions = options;
  }

  /**
   * Registers an app method.
   * @param {ApiXMethod} appMethod App method to register.
   */
  public registerAppMethod<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    appMethod: ApiXMethod<QuerySchema, BodySchema>
  ) {
    if (this.methodProvidesOwnedResources(appMethod) && !appMethod.requestorOwnsResource) {
      throw new Error(`Attempting to register a method that provides owned resources without implementing 'requestorOwnsResource'.`);
    }

    const endpoint = this.endpointForMethod(appMethod);
    if (this.isMethodRegistered(appMethod)) {
      throw new Error('This endpoint and HTTP method already exist.');
    } else {
      this.registeredMethods[endpoint] = appMethod;
    }

    const inputQueryParameterProcessor = new ApiXInputUrlQueryParameterProcessor<QuerySchema>();

    const self = this;
    const methodWrappedHandler: ExpressHandler = async (req: Request, res: Response) => {
      // Get and verify all implicitly required queries
      const startTime = Date.now();
      if (!self.verifyHeadersInRequest(req)) {
        res.status(400).send(this.makeErrorResponse('missingRequiredHeaders'));
        this.emitStatusMetric(400, appMethod);
        this.emitMetric(
          MetricName.RejectedRequest, 1,
          {
            reason: RequestRejectionReason.MissingRequiredHeaders
          },
          appMethod
        );
        return;
      }

      const apiKey = req.header(ApiXHttpHeaders.ApiKey) as string;

      if (!this.developerModeEnabled && !(await self.verifyApp(apiKey ?? ''))) {
        res.status(401).send(this.makeErrorResponse('unauthorizedApp'));
        this.emitStatusMetric(401, appMethod);
        this.emitMetric(
          MetricName.RejectedRequest, 1,
          {
            reason: RequestRejectionReason.UnauthorizedApp
          },
          appMethod
        );
        return;
      }

      if (!this.developerModeEnabled && !(await self.verifyRequest(req))) {
        res.status(401).send(this.makeErrorResponse('invalidRequest'));
        this.emitStatusMetric(401, appMethod);
        this.emitMetric(
          MetricName.RejectedRequest, 1,
          {
            reason: RequestRejectionReason.InvalidRequest
          },
          appMethod
        );
        return;
      }

      // Verify method parameters
      let queryParameters: QuerySchema | undefined;
      if (appMethod.queryParameters && appMethod.queryParameters.length > 0) {
        try {
          queryParameters = inputQueryParameterProcessor.process(
            req,
            appMethod.queryParameters
          );
        } catch (error) {
          if (error instanceof Error) {
            res.status(400).send(makeApiXErrorResponse('invalidRequestParameters', error.message));
            this.emitStatusMetric(400, appMethod);
          } else {
            res.status(400).send(this.makeErrorResponse('unknownError'));
            this.emitStatusMetric(400, appMethod);
          }
          this.emitMetric(
            MetricName.RejectedRequest, 1,
            {
              reason: RequestRejectionReason.UrlParametersVerificationError
            },
            appMethod
          );
          return;
        }
      }

      const jsonBodyRequired = appMethod.jsonBodyRequired ?? false;

      if (jsonBodyRequired && (!req.body || Object.keys(req.body).length === 0)) {
        res.status(400).send(this.makeErrorResponse('missingJsonBody'));
        this.emitStatusMetric(400, appMethod);
        this.emitMetric(
          MetricName.RejectedRequest, 1,
          {
            reason: RequestRejectionReason.MissingRequiredJsonBody
          },
          appMethod
        );
        return;
      }

      if (appMethod.jsonBodyValidator
        && req.body
        && Object.keys(req.body).length > 0
        && !appMethod.jsonBodyValidator.isValid(req.body)) {
        res.status(400).send(this.makeErrorResponse('invalidJsonBody'));
        this.emitStatusMetric(400, appMethod);
        this.emitMetric(
          MetricName.RejectedRequest, 1,
          {
            reason: RequestRejectionReason.InvalidJsonBody
          },
          appMethod
        );
        return;
      }

      const jsonBody = req.body && Object.keys(req.body).length > 0
          ? req.body as BodySchema
          : undefined;
      
      const accessLevel = await self.accessLevelEvaluator.evaluate(
        appMethod, 
        apiXRequest(
          req,
          ApiXAccessLevel.NoAccess, /// Provisional until actual access level is determined.
          queryParameters,
          jsonBody
        )
      );

      if (!self.verifyRequestAuthorization(appMethod, accessLevel)) {
        this.logger?.warn(`Attempted access to resource without authorization.`);
        res.status(401).send(this.makeErrorResponse('unauthorizedRequest'));
        this.emitStatusMetric(401, appMethod);
        this.emitMetric(
          MetricName.RejectedRequest, 1,
          {
            reason: RequestRejectionReason.UnauthorizedRequest
          },
          appMethod
        );
        return;
      }

      const request = apiXRequest(
        req,
        accessLevel,
        queryParameters,
        jsonBody
      );
      const response = await appMethod.requestHandler(request, res);
      const status = response.status ?? 200;
      res.status(status).send(response.data);

      const elapsedTime = Date.now() - startTime;
      this.emitStatusMetric(status, appMethod);
      this.emitMetric(
        MetricName.SuccessfulRequest,
        status < 400 ? 1 : 0,
        {},
        appMethod
      );
      this.emitMetric(
        MetricName.RequestTime,
        elapsedTime,
        { unit: 'ms' },
        appMethod
      );
    };

    this.registerHandlerForAppMethod(methodWrappedHandler, appMethod, endpoint);
  }

  /**
   * Registers a wrapper request handler for an app method
   * @param {ExpressHandler} requestHandler
   * @param {ApiXMethod} appMethod
   */
  private registerHandlerForAppMethod<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    requestHandler: ExpressHandler,
    appMethod: ApiXMethod<QuerySchema, BodySchema>,
    endpoint: string
  ) {
    const httpMethod = appMethod.httpMethod || 'GET';

    if (httpMethod == 'GET') {
      this.app.get(endpoint, requestHandler);
    } else if (httpMethod == 'POST') {
      this.app.post(endpoint, requestHandler);
    } else if (httpMethod == 'PUT') {
      this.app.put(endpoint, requestHandler);
    } else if (httpMethod == 'DELETE') {
      this.app.delete(endpoint, requestHandler);
    } else if (httpMethod === 'PATCH') {
      this.app.patch(endpoint, requestHandler);
    } else if (httpMethod === 'ALL') {
      this.app.all(endpoint, requestHandler);
    }
  }

  /**
   * Verifies the request's integrity and authorization.
   * @param {Request} req Request object.
   * @return {boolean} true if the request is authorized and unmodified.
   */
  private async verifyRequest(req: Request): Promise<boolean> {
    // Verify Request Date is Valid
    const apiKey = req.header(ApiXHttpHeaders.ApiKey);
    const dateString = req.header(ApiXHttpHeaders.Date);
    const signature = req.header(ApiXHttpHeaders.Signature);
    const signatureNonce = req.header(ApiXHttpHeaders.SignatureNonce);

    // In milliseconds
    const maxRequestAge = this.appConfig.valueForKey<number>(ApiXConfigKey.MaxRequestAge);

    if (!maxRequestAge || !dateString || !apiKey || !signature || !signatureNonce) {
      return false;
    }

    const date = new Date(dateString).getTime();

    if (isNaN(date)) {
      return false;
    }

    const now = Date.now();
    const diff = now - date;

    if (diff < 0 || diff > maxRequestAge) {
      return false;
    }

    try {
      const appSigningKey = await this.dataManager.getAppKeyForApiKey(apiKey) || '';

      const cacheKey = apiKey + signature;

      // Verify this apiKey and signature combination has not been used before.
      if (await this.appCache.valueForKey(cacheKey) as string === signature) {
        this.logger?.warn(`A request will be rejected due to signature duplication. This could be an indication of an MITM attack.`);
        return false;
      }

      // Verify Session
      const hmac = createHmac('sha256', appSigningKey);
      const httpBody = Object.keys(req.body).length > 0 ?
            JSON.stringify(this.sortedObjectKeys(req.body)) : '';
      const httpBodyBase64 = httpBody.length > 0 ?
            Buffer.from(httpBody, 'binary').toString('base64') : '';
      const path = req.originalUrl.split('?')[0];
      const search = req.originalUrl.split('?')[1] || ''
      const pathWithQueries = `${path}${search ? `?${search}` : ''}`;
      const message =
        `${pathWithQueries}.${req.method.toUpperCase()}.${signatureNonce}.${dateString}.${httpBodyBase64}`;
      const calculatedSignature = hmac
        .update(message, 'utf-8')
        .digest()
        .toString('hex');
      
      if (calculatedSignature === signature) {
        await this.appCache.setValueForKey(signature, cacheKey);
      }

      return calculatedSignature === signature;
    } catch (error) {
      this.logger?.error(`An error occurred when verifying request: ${error}`);
      return false;
    }
  }

  /**
   * Sorts all the keys in an object recursively.
   * @param obj The object whose key are to be sorted.
   * @returns The object with its keys recursively sorted.
   */
  private sortedObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
    const sortedObj: Record<string, unknown> = {};
    Object.keys(obj).sort().forEach(key => {
      const value = obj[key];
      sortedObj[key] = value !== null && typeof value === 'object' && !Array.isArray(value)
        ? this.sortedObjectKeys(value as Record<string, unknown>)
        : value;
    });
    return sortedObj;
  }

  /**
   * Verifies that the app making the request is a valid app.
   * @param {string} apiKey Api Key of the request.
   * @return {boolean} `true` if API Key is valid, `false` otherwise.
   */
  private async verifyApp(apiKey: string): Promise<boolean> {
    try {
      const appKey = await this.dataManager.getAppKeyForApiKey(apiKey);
      return appKey !== null && appKey.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Verifies if there's enough clearance to access the resource
   * @param {ApiXMethod} appMethod The method to access.
   * @param {ApiXAccessLevel} requestorAccessLevel Access level of the requestor.
   * @return {boolean} true if enough if requestor has enough access.
   */
  private verifyRequestAuthorization<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    appMethod: ApiXMethod<QuerySchema, BodySchema>,
    requestorAccessLevel: ApiXAccessLevel
  ): boolean {

    /**
     * First, verify if app method has any closed characteristics.
     */
    if (appMethod.characteristics.has(ApiXMethodCharacteristic.Internal)) {
      /// Anything that is internal requires an access level of `Admin`.
      return requestorAccessLevel === ApiXAccessLevel.Admin;
    } else if (appMethod.characteristics.has(ApiXMethodCharacteristic.Moderative)) {
      /// For moderative endpoints, at least a `Moderator` is required.
      return requestorAccessLevel <= ApiXAccessLevel.Moderator;
    } else if (appMethod.characteristics.has(ApiXMethodCharacteristic.Institutional)) {
      /// For instituitional endpoints, at least a `Manager` is required.
      return requestorAccessLevel <= ApiXAccessLevel.Manager;
    } else if (appMethod.characteristics.has(ApiXMethodCharacteristic.Special)) {
      /// For special endpoints, at least a `PrivilegedRequestor` is required.
      return requestorAccessLevel <= ApiXAccessLevel.PrivilegedRequestor;
    }

    /**
     * For open characteristics, the priority order is inverted so that these endpoints
     * can be accessed and serve the minimum amount of data that the requestor has
     * access to.
     */
    if (appMethod.characteristics.has(ApiXMethodCharacteristic.PublicUnownedData)) {
      /// Anything that can serve public data only requires an access level of `Public`.
      return requestorAccessLevel <= ApiXAccessLevel.PublicRequestor;
    } else if (appMethod.characteristics.has(ApiXMethodCharacteristic.PublicOwnedData)) {
      /// Anything that can serve public owned data but not public unowned data only
      /// required `AuthenticatedRequestor`.
      return requestorAccessLevel <= ApiXAccessLevel.AuthenticatedRequestor;
    } else if (appMethod.characteristics.has(ApiXMethodCharacteristic.PrivateOwnedData)) {
      /// Anything that only serves private owned data requires the requestor be `ResourceOwner`.
      return requestorAccessLevel <= ApiXAccessLevel.ResourceOwner;
    }

    // If a method has no characteristics, it cannot be accessed.
    return false;
  }

  /**
   * Verifies if the required keys exist in the request data.
   * @param {[string]} requiredKeys Keys required in request.
   * @param {ApiXJsonDictionary<unknown>} data Request data.
   * @return {boolean} true or false.
   */
  private verifyHeadersInRequest(req: Request): boolean {
    const requiredHeaders = [
      ApiXHttpHeaders.ApiKey,
      ApiXHttpHeaders.Date,
      ApiXHttpHeaders.Signature,
      ApiXHttpHeaders.SignatureNonce
    ];

    for (const header of requiredHeaders) {
      if (!req.header(header)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Provides the route or endpoint for an app method.
   * @param {ApiXMethod} appMethod App method.
   * @return {string} Endpoint or route.
   */
  private endpointForMethod<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    appMethod: ApiXMethod<QuerySchema, BodySchema>
  ): string {
    if (!appMethod.entity && !appMethod.method) {
      return '/';
    }

    let endpoint = path.join(appMethod.entity || '', appMethod.method);

    if (endpoint.endsWith('/')) {
      endpoint = endpoint.substring(0, endpoint.length - 1);
    }

    return endpoint[0].startsWith('/') ? endpoint : '/' + endpoint;
  }

  /**
   * Determines if a provided method already exists
   * @param {ApiXMethod} appMethod App method
   * @return {boolean} Returns true if a method with this route and http method is registered
   */
  private isMethodRegistered<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    appMethod: ApiXMethod<QuerySchema, BodySchema>
  ): boolean {
    const method = this.registeredMethods[this.endpointForMethod(appMethod)];
    return method && method.httpMethod == appMethod.httpMethod;
  }

  /**
   * Determines whether a given method provides owned data / resources.
   * @param {ApiXMethod} appMethod The method to check.
   * @returns `true` if the method provides owned resources.
   */
  private methodProvidesOwnedResources<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    appMethod: ApiXMethod<QuerySchema, BodySchema>
  ): boolean {
    return appMethod.characteristics.has(ApiXMethodCharacteristic.PrivateOwnedData)
        || appMethod.characteristics.has(ApiXMethodCharacteristic.PublicOwnedData);
  }

  /**
   * Emits a count metric.
   * @param name Metric name.
   * @param value Value to emit.
   * @param tags Tags / dimensions to emit with the metric.
   * @param method The API-X method emitting this metric.
   */
  private emitMetric<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(
    name: string,
    value: number,
    tags: MetricTags,
    method: ApiXMethod<QuerySchema, BodySchema>) {
    const finalTags = { 
      ...tags,
      ...(this.metricManagerOptions?.tags ?? {}),
      endpoint: this.endpointForMethod(method),
      httpMethod: method.httpMethod || 'GET'
    };
    this.metricManager
      ?.emit(`${this.metricManagerOptions?.namePrefix ?? ''}${name}`, value, finalTags);
  }

  /**
   * Emits a status metric.
   * @param statusCode The HTTP status code.
   * @param method The API-X method emitting this metric.
   */
  private emitStatusMetric<
    QuerySchema extends ApiXRequestInputSchema,
    BodySchema extends ApiXRequestInputSchema
  >(statusCode: number, method: ApiXMethod<QuerySchema, BodySchema>) {
    let statusRange: string;

    if (statusCode < 300) {
      statusRange = '200x';
    } else if (statusCode < 400) {
      statusRange = '300x';
    } else if (statusCode < 500) {
      statusRange = '400x';
    } else {
      statusRange = '500x';
    }

    const tags = {
      status: statusRange
    };

    this.emitMetric(MetricName.HttpStatusCode, 1, tags, method);
  }

  /**
   * Creates an error response for the given error ID.
   * @param {ApiXResponseErrorId} id The error ID.
   * @returns {ApiXJsonDictionary<unknown>} The error response.
   */
  private makeErrorResponse(id: ApiXResponseErrorId): ApiXJsonDictionary<unknown> {
    return makeApiXErrorResponse(id, errorMessages[id]);
  }
}

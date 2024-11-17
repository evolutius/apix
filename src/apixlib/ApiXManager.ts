import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import { ApiXConfig, ApiXConfigKey } from './ApiXConfig';
import { Request, Response } from 'express';
import { ApiXAccessLevel } from './common/ApiXAccessLevel';
import { ApiXAccessLevelEvaluator } from './common/ApiXAccessLevelEvaluator';
import { ApiXCache } from './common/ApiXCache';
import { ApiXDataManager } from './ApiXDataManager';
import { ApiXErrorResponseMessage } from './common/ApiXErrorResponseMessage';
import { ApiXHttpHeaders } from './common/ApiXHttpHeaders';
import { ApiXInputUrlQueryParameterProcessor } from './common/methods/ApiXInputUrlQueryParameterProcessor';
import { ApiXMethod } from './common/methods/ApiXMethod';
import { ApiXMethodCharacteristic } from './common/methods/ApiXMethodCharacteristic';
import { ApiXRequest } from './common/ApiXRequest';
import { ApiXRequestInputSchema } from './common/methods/ApiXRequestInputSchema';
import { createHmac } from 'crypto';
import { makeApiXErrorResponse } from './common/utils/makeApiXErrorResponse';

/**
 * Type used to define an express handler as used in API-X.
 */
type ExpressHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Main class of the API
 * Request body and method response is always assumed to be JSON
 */
export class ApiXManager {
  private app;
  private appConfig: ApiXConfig;
  private accessLevelEvaluator: ApiXAccessLevelEvaluator;
  private dataManager: ApiXDataManager;
  private appCache: ApiXCache | undefined;
  private registeredMethods: Record<string, ApiXMethod<any, any>>;

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
   */
  public constructor(
      evaluator: ApiXAccessLevelEvaluator,
      dataManager: ApiXDataManager,
      appConfig: ApiXConfig,
      appCache?: ApiXCache
  ) {
    this.app = express();
    this.appConfig = appConfig;
    this.accessLevelEvaluator = evaluator;
    this.dataManager = dataManager;
    this.appCache = appCache;
    this.registeredMethods = {};

    /// TLS / SSL enforcement
    this.app.use(bodyParser.json());
    const self = this;
    this.app.use((req, res, next) => {
      if (self.developerModeEnabled || req.secure || req.header(ApiXHttpHeaders.ForwardedProto) === 'https') {
        next();
      } else {
        // Request was not made over HTTPS
        res.status(403).send(makeApiXErrorResponse(ApiXErrorResponseMessage.InsecureProtocol));
      }
    });
  }

  /**
   * Starts the API service.
   */
  public start() {
    if (Object.keys(this.registeredMethods).length == 0) {
      throw new Error('No method has been registered');
    }
    
    if (!this.appConfig.valueForKey(ApiXConfigKey.Port)) {
      throw new Error('No port specified in API configuration');
    }
    
    const self = this;
    const port = this.appConfig.valueForKey(ApiXConfigKey.Port) as number;
    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
      if (self.developerModeEnabled) {
        console.log(`\x1b[33mWarning: Developer Mode is enabled which decreases security.
          Make sure this is disabled in a production environment.\x1b[0m`);
      }
    });
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
      if (!self.verifyHeadersInRequest(req)) {
        res.status(400).send(makeApiXErrorResponse(ApiXErrorResponseMessage.MissingRequiredHeaders));
        return;
      }

      const apiKey = req.header(ApiXHttpHeaders.ApiKey) as string;

      if (!this.developerModeEnabled && !(await self.verifyApp(apiKey ?? ''))) {
        res.status(401).send(makeApiXErrorResponse(ApiXErrorResponseMessage.UnauthorizedApp));
        return;
      }

      if (!this.developerModeEnabled && !(await self.verifyRequest(req))) {
        res.status(401).send(makeApiXErrorResponse(ApiXErrorResponseMessage.InvalidRequest));
        return;
      }

      const requestorAccessLevel = await self.accessLevelEvaluator.evaluate(appMethod, req);

      if (!self.verifyRequestAuthorization(appMethod, requestorAccessLevel)) {
        res.status(401).send(makeApiXErrorResponse(ApiXErrorResponseMessage.UnauthorizedRequest));
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
            res.status(400).send(makeApiXErrorResponse(error.message));
          } else {
            res.status(400).send(ApiXErrorResponseMessage.UnknownError)
          }
          return;
        }
      }

      const jsonBodyRequired = appMethod.jsonBodyRequired ?? false;

      if (jsonBodyRequired && (!req.body || Object.keys(req.body).length === 0)) {
        res.status(400).send(makeApiXErrorResponse(ApiXErrorResponseMessage.MissingJsonBody));
        return;
      }

      if (appMethod.jsonBodyValidator
        && req.body
        && Object.keys(req.body).length > 0
        && !appMethod.jsonBodyValidator.isValid(req.body)) {
        res.status(400).send(makeApiXErrorResponse(ApiXErrorResponseMessage.InvalidJsonBody));
        return;
      }

      const request = {
        ...req,
        accessLevel: requestorAccessLevel,
        queryParameters,
        jsonBody: req.body && Object.keys(req.body).length > 0
          ? req.body : undefined
      } as ApiXRequest<QuerySchema, BodySchema>;

      res.send(await appMethod.requestHandler(request, res));
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
    const maxRequestAge = this.appConfig.valueForKey(ApiXConfigKey.MaxRequestAge) as number;

    if (!dateString || !apiKey || !signature || !signatureNonce) {
      return false;
    }

    const date = new Date(dateString).getTime();
    const now = Date.now();
    const diff = now - date;

    if (diff < 0 || diff > maxRequestAge) {
      return false;
    }

    const appSigningKey = await this.dataManager.getAppKeyForApiKey(apiKey) || '';

    const key = apiKey + signature;

    // Verify this apiKey and signature combination has not been used before.
    if (await this.appCache?.valueForKey(key) as string === signature) {
      return false;
    }

    // Verify Session
    const hmac = createHmac('sha256', appSigningKey);
    const httpBody = Object.keys(req.body).length > 0 ?
          JSON.stringify(req.body, Object.keys(req.body).sort()) : '';
    const httpBodyBase64 = httpBody.length > 0 ?
          Buffer.from(httpBody, 'binary').toString('base64') : '';
    const message =
      `${req.path}.${req.method}.${signatureNonce}.${dateString}.${httpBodyBase64}`;
    const calculatedSignature = hmac
      .update(message, 'utf-8')
      .digest()
      .toString('hex');
    
    if (calculatedSignature === signature) {
      await this.appCache?.setValueForKey(signature, key);
    }

    return calculatedSignature === signature;
  }

  /**
   * Verifies that the app making the request is a valid app.
   * @param {string} apiKey Api Key of the request.
   * @return {boolean} true if API Key is valid.
   */
  private async verifyApp(apiKey: string): Promise<boolean> {
    const appKey = await this.dataManager.getAppKeyForApiKey(apiKey);
    return appKey != null && appKey.length > 0;
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
}

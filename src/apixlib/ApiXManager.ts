import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import {ApiXConfig} from './ApiXConfig';
import {ApiXDataManager} from './ApiXDataManager';
import {ApiXMethod, ApiXRequestHandler} from './ApiXMethod';
import {ApiXErrorResponseMessage as ApiXErrorResponseMessage} from './common/ApiXErrorResponseMessage';
import {ApiXJsonDictionary} from './common/ApiXJsonDictionary';
import {makeApiXErrorResponse} from './common/makeApiXErrorResponse';
import {ApiXUrlRequestQuery as ApiXUrlRequestQuery} from './ApiXConstants';
import {ApiXClearanceLevel, ApiXClearanceLevelDeterminator} from './common/ApiXClearanceLevel';
import {ApiXCache} from './common/ApiXCache';
import {createHash} from 'crypto';
import {Request} from 'express';

/**
 * Main class of the API
 * Request body and method response is always assumed to be JSON
 */
export class ApiXManager {
  private app;
  private appConfig: ApiXConfig;
  private clearanceLevelDeterminator: ApiXClearanceLevelDeterminator;
  private appDataManager: ApiXDataManager;
  private appCache: ApiXCache | undefined;
  private registeredMethods: {[key: string] : ApiXMethod};

  /**
   * Constructor
   * @param {ApiXClearanceLevelDeterminator} clDeterminator
   * @param {ApiXDataManager} dataManager
   */
  public constructor(
      clDeterminator: ApiXClearanceLevelDeterminator,
      dataManager: ApiXDataManager, appConfig: ApiXConfig, appCache?: ApiXCache) {
    this.app = express();
    this.app.use(bodyParser.json());
    this.appConfig = appConfig;
    this.clearanceLevelDeterminator = clDeterminator;
    this.appDataManager = dataManager;
    this.appCache = appCache;
    this.registeredMethods = {};
  }

  /**
   * Starts API Service
   */
  public run() {
    if (Object.keys(this.registeredMethods).length == 0) {
      throw 'No method has been registered';
    }
    
    if (!this.appConfig.valueForKey('port')) {
      throw 'No port specified in API configuration';
    }

    const port = this.appConfig.valueForKey('port') as number;
    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }

  /**
   * Registers an app method
   * @param {ApiXMethod} appMethod App method to register
   */
  public registerAppMethod(appMethod: ApiXMethod) {
    const endpoint = this.endpointForMethod(appMethod);
    if (this.isMethodRegistered(appMethod)) {
      throw 'This endpoint and HTTP method already exist.';
    } else {
      this.registeredMethods[endpoint] = appMethod;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const methodWrappedHandler: ApiXRequestHandler = (req, res) => {
      // Get and verify all implicitly required queries
      const requiredParams = [
        ApiXUrlRequestQuery.apiKey,
        ApiXUrlRequestQuery.appSessionId,
      ];

      if (!self.verifyParamsInRequest(requiredParams, req.query)) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.missingRequiredParams));
        return;
      }

      const apiKey = req.query[ApiXUrlRequestQuery.apiKey] as string;
      const appSessionId = req.query[ApiXUrlRequestQuery.appSessionId] as string;

      if (!self.verifyApp(apiKey || '')) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.unauthorizedApp));
        return;
      }

      if (!self.verifySession(
          apiKey || '', appSessionId || '', req)) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.invalidRequest));
        return;
      }

      const clearanceLevel =
          self.clearanceLevelDeterminator.determine(appMethod, req);

      if (!self.verifyClearanceLevel(appMethod.requiredClearanceLevel || ApiXClearanceLevel.CL6, clearanceLevel)) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.unauthorizedRequest));
        return;
      }

      // Verify Method Required Parameters
      if (!self.verifyParamsInRequest(appMethod.requiredParams || [], req.query)) {
        res.send(makeApiXErrorResponse(
            ApiXErrorResponseMessage.missingRequiredMethodParams));
        return;
      }

      res.send(appMethod.requestHandler(req, res));
    };

    this.registerHandlerForAppMethod(methodWrappedHandler, appMethod, endpoint);
  }

  /**
   * Registers a wrapper request handler for an app method
   * @param {ApiXRequestHandler} requestHandler
   * @param {ApiXMethod} appMethod
   */
  private registerHandlerForAppMethod(
      requestHandler: ApiXRequestHandler, appMethod: ApiXMethod, endpoint: string) {
    const httpMethod = appMethod.httpMethod || 'GET';

    if (httpMethod == 'GET') {
      this.app.get(endpoint, requestHandler);
    } else if (httpMethod == 'POST') {
      this.app.post(endpoint, requestHandler);
    } else if (httpMethod == 'PUT') {
      this.app.put(endpoint, requestHandler);
    } else if (httpMethod == 'DELETE') {
      this.app.delete(endpoint, requestHandler);
    } else {
      this.app.all(endpoint, requestHandler);
    }
  }

  /**
   * Verifies that the app making the request is a valid app
   * @param {string} apiKey Api Key of the request
   * @param {string} appSessionId Unique app session ID of the request
   * @param {Request} req Request object
   * @return {boolean} true if the session ID is valid
   */
  private verifySession(
    apiKey: string, appSessionId: string, req: Request): boolean {
    // Verify Request Date is Valid
    const dateString = req.headers.date;
    const maxDateDifference = this.appConfig.valueForKey('maxRequestDateDifference') as number;
    const appSessionOnce = this.appConfig.valueForKey('appSessionOnce') as boolean;

    if (!dateString) {
      return false;
    }

    const date = new Date(dateString).getTime();
    const now = Date.now();
    const diff = now - date;

    if (diff < 0 || diff > maxDateDifference) {
      return false;
    }

    if (appSessionOnce) {
      const key = apiKey + appSessionId;
      // This apiKey appSessionId combination has been used before.
      if (this.appCache?.valueForKey(key) as string === appSessionId) {
        return false;
      }
    }

    // Verify Session
    const salt = req.header('API-X-Salt') || '';
    const hash = createHash('sha256');
    const appKey = this.appDataManager.getAppKeyForApiKey(apiKey) || '';
    const httpBody = Object.keys(req.body).length > 0 ?
          JSON.stringify(req.body, Object.keys(req.body).sort()) : '';
    const httpBodyBase64 = httpBody.length > 0 ?
          Buffer.from(httpBody, 'binary').toString('base64') : '';
    const calculatedSessionId =
        hash.update(httpBodyBase64 + appKey + dateString + salt, 'utf-8')
            .digest()
            .toString('hex');
    
    if (appSessionOnce && calculatedSessionId === appSessionId) {
      this.appCache?.setValueForKey(appSessionId, apiKey + appSessionId);
    }

    return calculatedSessionId === appSessionId;
  }

  /**
   * Verifies that the app making the request is a valid app
   * @param {string} apiKey Api Key of the request
   * @return {boolean} true if API Key is valid
   */
  private verifyApp(
    apiKey: string): boolean {
    const appKey = this.appDataManager.getAppKeyForApiKey(apiKey);
    return appKey != null && appKey.length > 0;
  }

  /**
   * Verifies if there's enough clearance to access the resource
   * @param {ApiXClearanceLevel} requiredCl required clearance level
   * @param {ApiXClearanceLevel} currentCl current clearance level in request
   * @return {boolean} true if enough clereance to access the resource
   */
  private verifyClearanceLevel(
    requiredCl: ApiXClearanceLevel, currentCl: ApiXClearanceLevel): boolean {
    return currentCl <= requiredCl;
  }

  /**
   * Verifies if the required parameters exist in the url query
   * @param {[string]} requiredParams Parameters required in request
   * @param {ApiXJsonDictionary<string>} urlQueries Request queries
   * @return {boolean} true or false
   */
  private verifyParamsInRequest(
    requiredParams: string[], urlQueries: ApiXJsonDictionary<unknown>): boolean {
    for (let i = 0; i < requiredParams.length; ++i) {
      const param = requiredParams[i];
      if (!urlQueries[param]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Provides the route or endpoint for an app method
   * @param {ApiXMethod} appMethod App method
   * @return {string} Endpoint or route
   */
  private endpointForMethod(appMethod: ApiXMethod): string {
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
  private isMethodRegistered(appMethod: ApiXMethod): boolean {
    const method = this.registeredMethods[this.endpointForMethod(appMethod)];
    return method && method.httpMethod == appMethod.httpMethod;
  }
}

import express from 'express';
import bodyParser from 'body-parser';
import {ApiXConfig} from './ApiXConfig';
import {ApiXDataManager} from './ApiXDataManager';
import {ApiXMethod, ApiXRequestHandler} from './ApiXMethod';
import {ApiXErrorResponseMessage as ApiXErrorResponseMessage} from './common/ApiXErrorResponseMessage';
import {makeApiXErrorResponse} from './common/makeApiXErrorResponse';
import {verifyParamsInRequest} from './sec/verifyParamsInRequest';
import {ApiXUrlRequestQuery as ApiXUrlRequestQuery} from './ApiXConstants';
import {appSessionVerify} from './sec/appSessionVerify';
import {appVerify} from './sec/appVerify';
import {appVerifyClearanceLevel} from './sec/appVerifyClearanceLevel';
import {ApiXClearanceLevel, ApiXClearanceLevelDeterminator} from './sec/ApiXClearanceLevel';

/**
 * Main class of the API
 * Request body and method response is always assumed to be JSON
 */
export class ApiXManager {
  private app;
  private appConfig: ApiXConfig;
  private clearanceLevelDeterminator: ApiXClearanceLevelDeterminator;
  private appDataManager: ApiXDataManager;

  /**
   * Constructor
   * @param {ApiXClearanceLevelDeterminator} clDeterminator
   * @param {ApiXDataManager} dataManager
   */
  public constructor(
      clDeterminator: ApiXClearanceLevelDeterminator, dataManager: ApiXDataManager, appConfig: ApiXConfig) {
    this.app = express();
    this.app.use(bodyParser.json());
    this.appConfig = appConfig;
    this.clearanceLevelDeterminator = clDeterminator;
    this.appDataManager = dataManager;
  }

  /**
   * Starts API Service
   */
  public run() {
    let port = 3000;

    if (this.appConfig.valueForKey('port')) {
      port = this.appConfig.valueForKey('port') as number;
    }

    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }

  /**
   * Registers an app method
   * @param {ApiXMethod} appMethod App method to register
   */
  public registerAppMethod(appMethod: ApiXMethod) {
    const methodWrappedHandler: ApiXRequestHandler = (req, res) => {
      // Get and verify all implicitly required queries
      const requiredParams = [
        ApiXUrlRequestQuery.apiKey,
        ApiXUrlRequestQuery.appSessionId,
      ];

      if (!verifyParamsInRequest(requiredParams, req.query)) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.missingRequiredParams));
        return;
      }

      const apiKey = req.query[ApiXUrlRequestQuery.apiKey] as string;
      const appSessionId = req.query[ApiXUrlRequestQuery.appSessionId] as string;

      if (!appVerify(apiKey || '', this.appDataManager)) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.unauthorizedApp));
        return;
      }

      if (!appSessionVerify(
          apiKey || '', appSessionId || '', req,
              this.appConfig.valueForKey('max_req_date_diff') as number,
              this.appDataManager)) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.invalidRequest));
        return;
      }

      const clearanceLevel =
          this.clearanceLevelDeterminator.determine(appMethod, req);

      if (!appVerifyClearanceLevel(appMethod.requiredClearanceLevel || ApiXClearanceLevel.CL6, clearanceLevel)) {
        res.send(makeApiXErrorResponse(ApiXErrorResponseMessage.unauthorizedRequest));
        return;
      }

      // Verify Method Required Parameters
      if (!verifyParamsInRequest(appMethod.requiredParams || [], req.query)) {
        res.send(makeApiXErrorResponse(
            ApiXErrorResponseMessage.missingRequiredMethodParams));
        return;
      }

      res.send(appMethod.requestHandler(req, res));
    };

    this.registerHandlerForAppMethod(methodWrappedHandler, appMethod);
  }

  /**
   * Registers a wrapper request handler for an app method
   * @param {ApiXRequestHandler} requestHandler
   * @param {ApiXMethod} appMethod
   */
  private registerHandlerForAppMethod(
      requestHandler: ApiXRequestHandler, appMethod: ApiXMethod) {
    let endpoint: string;

    if (appMethod.entity) {
      endpoint = `/${appMethod.entity}/${appMethod.method}`;
    } else {
      endpoint = `/${appMethod.method}`;
    }

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
}

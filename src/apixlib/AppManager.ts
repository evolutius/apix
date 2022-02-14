import express from 'express';
import bodyParser from 'body-parser';
import {AppConfig} from './AppConfig';
import {AppDataManager} from './AppDataManager';
import {AppMethod, RequestHandler} from './AppMethod';
import {ErrorResponseMessage} from './common/ErrorResponseMessage';
import {makeErrorResponse} from './common/makeErrorResponse';
import {verifyParamsInRequest} from './sec/verifyParamsInRequest';
import {ApiUrlRequestQuery} from './Constants';
import {appSessionVerify} from './sec/appSessionVerify';
import {appVerify} from './sec/appVerify';
import {appVerifyClearanceLevel} from './sec/appVerifyClearanceLevel';
import {ClearanceLevelDeterminator} from './sec/ClearanceLevel';

/**
 * Main class of the API
 * Request body and method response is always assumed to be JSON
 */
export class AppManager {
  private static PORT = 3000;
  private app;
  private appConfig: AppConfig;
  private clearanceLevelDeterminator: ClearanceLevelDeterminator;
  private appDataManager: AppDataManager;

  /**
   * Constructor
   * @param {ClearanceLevelDeterminator} clDeterminator
   * @param {AppDataManager} dataManager
   */
  public constructor(
      clDeterminator: ClearanceLevelDeterminator, dataManager: AppDataManager) {
    this.app = express();
    this.app.use(bodyParser.json());
    this.appConfig = new AppConfig();
    this.clearanceLevelDeterminator = clDeterminator;
    this.appDataManager = dataManager;
  }

  /**
   * Starts API Service
   */
  public run() {
    let port = AppManager.PORT;

    if (this.appConfig.valueForKey('port')) {
      port = this.appConfig.valueForKey('port') as number;
    }

    this.app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }

  /**
   * Registers an app method
   * @param {AppMethod} appMethod App method to register
   */
  public registerAppMethod(appMethod: AppMethod) {
    const methodWrappedHandler: RequestHandler = (req, res) => {
      // Get and verify all implicitly required queries
      const requiredParams = [
        ApiUrlRequestQuery.apiKey,
        ApiUrlRequestQuery.appSessionId,
      ];

      if (!verifyParamsInRequest(requiredParams, req.query)) {
        res.send(makeErrorResponse(ErrorResponseMessage.missingRequiredParams));
        return;
      }

      const apiKey = req.query[ApiUrlRequestQuery.apiKey] as string;
      const appSessionId = req.query[ApiUrlRequestQuery.appSessionId] as string;

      if (!appVerify(apiKey || '', this.appDataManager)) {
        res.send(makeErrorResponse(ErrorResponseMessage.unauthorizedApp));
        return;
      }

      if (!appSessionVerify(
          apiKey || '', appSessionId || '', req,
              this.appConfig.valueForKey('max_req_date_diff') as number,
              this.appDataManager)) {
        res.send(makeErrorResponse(ErrorResponseMessage.invalidRequest));
        return;
      }

      const clearanceLevel =
          this.clearanceLevelDeterminator.determine(appMethod, req);

      if (!appVerifyClearanceLevel(appMethod.requiredCl, clearanceLevel)) {
        res.send(makeErrorResponse(ErrorResponseMessage.unauthorizedRequest));
        return;
      }

      // Verify Method Required Parameters
      if (!verifyParamsInRequest(appMethod.requiredParams, req.query)) {
        res.send(makeErrorResponse(
            ErrorResponseMessage.missingRequiredMethodParams));
        return;
      }

      res.send(appMethod.requestHandler(req, res));
    };

    this.registerHandlerForAppMethod(methodWrappedHandler, appMethod);
  }

  /**
   * Registers a wrapper request handler for an app method
   * @param {RequestHandler} requestHandler
   * @param {AppMethod} appMethod
   */
  private registerHandlerForAppMethod(
      requestHandler: RequestHandler, appMethod: AppMethod) {
    let endpoint: string;

    if (appMethod.entity) {
      endpoint = `/${appMethod.entity}/${appMethod.method}`;
    } else {
      endpoint = `/${appMethod.method}`;
    }

    const httpMethod = appMethod.httpMethod;

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

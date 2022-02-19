/* eslint-disable @typescript-eslint/no-unused-vars */
import {ApiXManager} from "../ApiXManager";
import {ApiXMethod} from "../ApiXMethod";
import {ApiXClearanceLevel, ApiXClearanceLevelDeterminator} from "../common/ApiXClearanceLevel";
import {Request} from 'express';
import {ApiXDataManager} from "../ApiXDataManager";
import {ApiXConfig} from "../ApiXConfig";
import {ApiXCache, ApiXMemoryStore} from "../common/ApiXCache";

export function mockApiXManager(
    expectedCl?: ApiXClearanceLevel, expectedAppKey?: string,
    expectedUserId?: string, useLocalCache?: boolean): ApiXManager {
  const clDeterminator: ApiXClearanceLevelDeterminator = {
    determine: (appMethod: ApiXMethod, req: Request) => { return expectedCl || ApiXClearanceLevel.CL0; },
  };

  const dataManager: ApiXDataManager = {
    getAppKeyForApiKey: (apiKey: string) => { return expectedAppKey || '' },
    getUserIdForSessionId: (sessionId: string) => { return expectedUserId || '' }
  };

  const appConfig = new ApiXConfig();

  let cache: ApiXCache | undefined = undefined;

  if (useLocalCache) {
    cache = new ApiXMemoryStore(appConfig);
  }

  return new ApiXManager(clDeterminator, dataManager, appConfig, cache);
}

import {AppConfig} from "./apixlib/AppConfig";
import {AppDataManager} from "./apixlib/AppDataManager";
import {AppManager} from "./apixlib/AppManager";
import {AppMethod} from "./apixlib/AppMethod";
import {ErrorResponseMessage} from "./apixlib/common/ErrorResponseMessage";
import {makeErrorResponse} from "./apixlib/common/makeErrorResponse";
import {ApiUrlRequestQuery} from "./apixlib/Constants";
import {ClearanceLevel} from "./apixlib/sec/ClearanceLevel";

export const ApiXErrorResponseMessage = ErrorResponseMessage;
export type ApiXErrorResponseMessage = ErrorResponseMessage;

export const ApiXClearanceLevel = ClearanceLevel;
export type ApiXClearanceLevel = ClearanceLevel;

export const ApiXConfig = AppConfig;
export type ApiXConfig = AppConfig;

export type ApiXDataManager = AppDataManager;

export const ApiXManager = AppManager;
export type ApiXManager = AppManager;

export type ApiXMethod = AppMethod;

export const ApiXUrlRequestQuery = ApiUrlRequestQuery;
export type ApiXUrlRequestQuery = ApiUrlRequestQuery;

export const makeApiXErrorResponse = makeErrorResponse;

/**
 * API-X Library
 * @module apix
 * 
 * @category API Reference
 */

/**
 * API Methods
 */
import { 
  BaseEndpointGenerator,
  EndpointGenerator,
  InternalResource,
  ModerativeResource,
  InstitutionalResource,
  ExclusiveResource,
  PrivateResource,
  PublicResource,
  AuthRequired,
  OwnerEvaluator,
  Route,
  HttpBody,
  QueryParameters
} from './apixlib/common/methods/Decorators';
import { HttpBodyValidator } from './apixlib/common/methods/HttpBodyValidator';
import { EndpointMethod, HttpMethod, RequestHandler } from './apixlib/common/methods/EndpointMethod';
import { MethodCharacteristic } from './apixlib/common/methods/MethodCharacteristic';
import { RequestInputSchema } from './apixlib/common/methods/RequestInputSchema';
import {
  UrlQueryParameter,
  MissingRequiredParameterError,
  InvalidParameterError
} from './apixlib/common/methods/UrlQueryParameter';
import {
  UrlQueryParameterProcessor,
  UrlQueryParameterPassthroughProcessor
} from './apixlib/common/methods/UrlQueryParameterProcessor';
import { UrlQueryParameterValidator } from './apixlib/common/methods/UrlQueryParameterValidator';
import { Request } from './apixlib/common/Request';
import { Response } from './apixlib/common/Response';

export {
  BaseEndpointGenerator,
  EndpointGenerator,
  InternalResource,
  ModerativeResource,
  InstitutionalResource,
  ExclusiveResource,
  PrivateResource,
  PublicResource,
  AuthRequired,
  OwnerEvaluator,
  Route,
  HttpBody,
  QueryParameters,

  HttpBodyValidator,
  /**
   * @deprecated use HttpBodyValidator instead.
   */
  HttpBodyValidator as ApiXHttpBodyValidator,

  EndpointMethod,
  /**
   * @deprecated use EndpointMethod instead.
   */
  EndpointMethod as ApiXMethod,

  HttpMethod,

  RequestHandler,
  /**
   * @deprecated use RequestHandler instead.
   */
  RequestHandler as ApiXRequestHandler,

  MethodCharacteristic,
  /**
   * @deprecated use MethodCharacteristic instead.
   */
  MethodCharacteristic as ApiXMethodCharacteristic,

  RequestInputSchema,
  /**
   * @deprecated use RequestInputSchema instead.
   */
  RequestInputSchema as ApiXRequestInputSchema,

  UrlQueryParameter,
  /**
   * @deprecated use UrlQueryParameter instead.
   */
  UrlQueryParameter as ApiXUrlQueryParameter,

  MissingRequiredParameterError,
  InvalidParameterError,

  UrlQueryParameterProcessor,
  /**
   * @deprecated use UrlQueryParameterProcessor instead.
   */
  UrlQueryParameterProcessor as ApiXUrlQueryParameterProcessor,

  UrlQueryParameterPassthroughProcessor,
  /**
   * @deprecated use UrlQueryParameterPassthroughProcessor instead.
   */
  UrlQueryParameterPassthroughProcessor as ApiXUrlQueryParameterPassthroughProcessor,

  UrlQueryParameterValidator,
  /**
   * @deprecated use UrlQueryParameterValidator instead.
   */
  UrlQueryParameterValidator as ApiXUrlQueryParameterValidator,

  Request,
  /**
   * @deprecated use Request instead.
   */
  Request as ApiXRequest,

  Response,
  /**
   * @deprecated use Response instead.
   */
  Response as ApiXResponse
}

/**
 * Access Control
 */
import { AccessLevel } from './apixlib/common/AccessLevel';
import { AccessLevelEvaluator } from './apixlib/common/AccessLevelEvaluator';

export {
  AccessLevel,
  /**
   * @deprecated use AccessLevel instead.
   */
  AccessLevel as ApiXAccessLevel,

  AccessLevelEvaluator,
  /**
   * @deprecated use AccessLevelEvaluator instead.
   */
  AccessLevelEvaluator as ApiXAccessLevelEvaluator
};

/**
 * Data Management & Cache
 */
import { DataManager } from './apixlib/DataManager';
import { Cache, CacheValue } from './apixlib/common/Cache';
import { RedisStore } from './apixlib/common/RedisStore';

export {
  DataManager,

  /**
   * @deprecated use DataManager instead.
   */
  DataManager as ApiXDataManager,

  Cache,
  /**
   * @deprecated use Cache instead.
   */
  Cache as ApiXCache,

  CacheValue,
  /**
   * @deprecated use CacheValue instead.
   */
  CacheValue as ApiXCacheValue,

  RedisStore,
  /**
   * @deprecated use RedisStore instead.
   */
  RedisStore as ApiXRedisStore
};

/**
 * Utility Types
 */
import { JsonDictionary } from './apixlib/common/JsonDictionary';
import { HttpHeaders } from './apixlib/common/HttpHeaders';

export {
  JsonDictionary,

  /**
   * @deprecated use JsonDictionary instead.
   */
  JsonDictionary as ApiXJsonDictionary,

  HttpHeaders,

  /**
   * @deprecated use HttpHeaders instead.
   */
  HttpHeaders as ApiXHttpHeaders
};

/**
 * Configuration & Management
 */
import { ApiXConfig } from './apixlib/ApiXConfig';
import { AppManager } from './apixlib/AppManager';

export {
  ApiXConfig,
  
  AppManager,
  /**
   * @deprecated use AppManager instead.
   */
  AppManager as ApiXManager
};

/**
 * Logging & Metrics
 */
import {
  MetricManager,
  MetricManagerOptions,
  MetricTags
} from './apixlib/common/MetricManager'
import { Logger } from './apixlib/common/Logger';

export {
  Logger,
  MetricManager,
  MetricManagerOptions,
  MetricTags
};

import { makeErrorResponse } from './apixlib/common/utils/makeErrorResponse';

export {
  makeErrorResponse,

  /**
   * @deprecated use makeErrorResponse instead.
   */
  makeErrorResponse as makeApiXErrorResponse
};

/**
 * Utility functions.
 */
const utils = {

  /** @deprecated use makeErrorResponse instead. */
  makeApiXErrorResponse: makeErrorResponse,
  makeErrorResponse,
};

export {
  utils
};

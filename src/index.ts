/**
 * API-X Library
 * @module apix
 * 
 * @category API Reference
 */

/**
 * API Methods
 */
export { ApiXHttpBodyValidator } from './apixlib/common/methods/ApiXHttpBodyValidator';
export { ApiXMethod, ApiXRequestHandler } from './apixlib/common/methods/ApiXMethod';
export { ApiXMethodCharacteristic } from './apixlib/common/methods/ApiXMethodCharacteristic';
export { ApiXRequestInputSchema } from './apixlib/common/methods/ApiXRequestInputSchema';
export { ApiXUrlQueryParameter } from './apixlib/common/methods/ApiXUrlQueryParameter';
export {
  ApiXUrlQueryParameterProcessor,
  ApiXUrlQueryParameterPassthroughProcessor
} from './apixlib/common/methods/ApiXUrlQueryParameterProcessor';
export { ApiXUrlQueryParameterValidator } from './apixlib/common/methods/ApiXUrlQueryParameterValidator';
export { ApiXRequest } from './apixlib/common/ApiXRequest';
export { ApiXResponse } from './apixlib/common/ApiXResponse';

/**
 * Access Control
 */
export { ApiXAccessLevel } from './apixlib/common/ApiXAccessLevel';
export { ApiXAccessLevelEvaluator } from './apixlib/common/ApiXAccessLevelEvaluator';

/**
 * Data Management & Cache
 */
export { ApiXDataManager } from './apixlib/ApiXDataManager';
export { ApiXCache, ApiXCacheValue } from './apixlib/common/ApiXCache';
export { ApiXRedisStore } from './apixlib/common/ApiXRedisStore';

/**
 * Utility Types
 */
export { ApiXJsonDictionary } from './apixlib/common/ApiXJsonDictionary';
export { ApiXHttpHeaders } from './apixlib/common/ApiXHttpHeaders';

/**
 * Configuration & Management
 */
export { ApiXConfig } from './apixlib/ApiXConfig';
export { ApiXManager } from './apixlib/ApiXManager';

/**
 * Logging & Metrics
 */
export { Logger } from './apixlib/common/Logger';
export {
  MetricManager,
  MetricManagerOptions,
  MetricTags
} from './apixlib/common/MetricManager'

import { makeApiXErrorResponse } from './apixlib/common/utils/makeApiXErrorResponse';

const utils = {
  makeApiXErrorResponse,
};

export {
  utils
};

import { Request } from 'express';
import { RequestInputSchema } from './RequestInputSchema';
import { UrlQueryParameter } from './UrlQueryParameter';

/**
 * A class to process a request and get a finalized version
 * of the query parameters.
 * 
 * @category Working with HTTP Endpoints
 */
export class InputUrlQueryParameterProcessor<T extends RequestInputSchema> {

  /**
   * Validates request query parameters to verify for presence
   * as well as validity.
   * @param req The request
   * @param queryParameters The definition of query parameters.
   * @throws `MissingRequiredParameterError` or `InvalidParameterError`.
   * @returns Parsed query parameters.
   */
  public process(
    req: Request,
    queryParameters: ReadonlyArray<UrlQueryParameter<unknown>>
  ): T {
    const result: T = {} as T;
    for (const queryParameter of queryParameters) {
      const validatedParameter = queryParameter.get(req);
      if (validatedParameter) {
        (result as Record<string, unknown>)[validatedParameter[0]] = validatedParameter[1];
      }
    }
    return result;
  }
}
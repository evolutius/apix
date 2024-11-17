import { ApiXRequestInputSchema } from './ApiXRequestInputSchema';
import { ApiXUrlQueryParameter } from './ApiXUrlQueryParameter';
import { Request } from 'express';

/**
 * A class to process a request and get a finalized version
 * of the query parameters.
 */
export class ApiXInputUrlQueryParameterProcessor<T extends ApiXRequestInputSchema> {

  /**
   * Validates request query parameters to verify for presence
   * as well as validity.
   * @param {Request} req The request
   * @param {ReadonlyArray<ApiXInputQueryParameter>} queryParameters The definition of query parameters.
   * @throws `MissingRequiredParameterError` or `InvalidParameterError`.
   * @returns Parsed query parameters.
   */
  public process(
    req: Request,
    queryParameters: ReadonlyArray<ApiXUrlQueryParameter<unknown>>
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
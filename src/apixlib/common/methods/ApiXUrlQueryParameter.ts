import { ApiXUrlQueryParameterProcessor } from './ApiXUrlQueryParameterProcessor';
import { ApiXUrlQueryParameterValidator } from './ApiXUrlQueryParameterValidator';
import { Request } from 'express';

/**
 * An error thrown when a required parameter is missing.
 */
export class MissingRequiredParameterError extends Error {
  constructor(name: string) {
    super(`Missing required parameter ${name}`);
  }
}

/**
 * An error thrown when a required parameter is missing.
 */
export class InvalidParameterError extends Error {
  constructor(name: string, value: string) {
    super(`Parameter ${name} has an invalid value: ${value}`);
  }
}

/**
 * An class that defines an _optional_ query parameter in a method.
 * 
 * Query parameters are included in the request URL as such:
 * `apix.example.com/entity/method?paramName=paramValue&param2=value2`
 * 
 * In this example, there are 2 parameters, `paramName` and `param2`, and
 * each has a value of `paramValue` and `value2`, respectively.
 */
export class ApiXUrlQueryParameter<T> {
  private _name: string;
  private _validator: ApiXUrlQueryParameterValidator;
  private _processor: ApiXUrlQueryParameterProcessor<T>;

  /**
   * An optional query parameter.
   * @param name The name of the parameter to define.
   * @param validator The object that validates the value of the parameter, if present.
   * @param processor The object that processes the parameter and its value, if present.
   */
  constructor(
    name: string,
    validator: ApiXUrlQueryParameterValidator,
    processor: ApiXUrlQueryParameterProcessor<T>,
    private isRequired: boolean = false
  ) {
    this._name = name;
    this._validator = validator;
    this._processor = processor;
  }

  /**
   * The name of URL query parameter.
   */
  public get name(): string {
    return this._name;
  }

  /**
   * The validator that determines whether the value of the parameter is valid.
   */
  public get validator(): ApiXUrlQueryParameterValidator {
    return this._validator;
  }

  /**
   * A processor that will transform a parameter into its most optimal form to
   * be used by a method request handler. For example, a parameter
   * `param=value1,value2,value3` can be transformed so that the value is
   * converted into a `ReadonlyArray<string>` or a `ReadonlySet<string>`.
   */
  public get processor(): ApiXUrlQueryParameterProcessor<T> {
    return this._processor;
  }

  /**
   * A method that validates and processes a parameter into its final form.
   * @param {Request} req The express request that contains the query parameters.
   * @throws `MissingRequiredParameterError` if the parameter is required but missing.
   * @throws `InvalidParameterError` if the parameter validation fails.
   * @returns The processed key value pair or `undefined` if missing and not required.
   */
  public get(req: Request): [string, T] | undefined {
    const value = req.query[this.name] as string ?? '';
    if (value.length === 0) {
      if (this.isRequired) {
        throw new MissingRequiredParameterError(this.name);
      }
      return undefined;
    }

    if (!this.validator.isValid(this.name, value)) {
      throw new InvalidParameterError(this.name, value);
    }

    return this.processor.process(this.name, value);
  }
}

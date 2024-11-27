/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApiXUrlQueryParameter,
  InvalidParameterError,
  MissingRequiredParameterError
} from '../ApiXUrlQueryParameter';
import { ApiXInputUrlQueryParameterProcessor } from '../ApiXInputUrlQueryParameterProcessor';
import { ApiXRequestInputSchema } from '../ApiXRequestInputSchema';
import { ApiXUrlQueryParameterProcessor } from '../ApiXUrlQueryParameterProcessor';
import { ApiXUrlQueryParameterValidator } from '../ApiXUrlQueryParameterValidator';
import { Request } from 'express';

describe('ApiXInputQueryParameterProcessor', () => {
  let mockValidator: jest.Mocked<ApiXUrlQueryParameterValidator>;
  let mockProcessor: jest.Mocked<ApiXUrlQueryParameterProcessor<any>>;

  beforeEach(() => {
    mockValidator = {
      isValid: jest.fn().mockReturnValue(true)
    };

    mockProcessor = {
      process: jest.fn().mockImplementation((name: string, value: any) => {
        return [name, value];
      })
    };
  });

  it('Correctly returns interface with all parameters present', () => {
    interface MyQueryParams extends ApiXRequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    const arrayProcessor: jest.Mocked<ApiXUrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new ApiXUrlQueryParameter('id', mockValidator, mockProcessor, true),
      new ApiXUrlQueryParameter('filters', mockValidator, arrayProcessor),
      new ApiXUrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        id: '001ABC',
        filters: 'group,lang,age',
        sortBy: 'title'
      }
    } as unknown as Request;

    const processor = new ApiXInputUrlQueryParameterProcessor<MyQueryParams>();
    const schema = processor.process(req, queryParameters);
    expect(schema).toEqual({
      id: '001ABC',
      filters: ['group', 'lang', 'age'],
      sortBy: 'title'
    });
  });

  it('Correctly returns interface with missing or empty optional parameters', () => {
    interface MyQueryParams extends ApiXRequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    const arrayProcessor: jest.Mocked<ApiXUrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new ApiXUrlQueryParameter('id', mockValidator, mockProcessor, true),
      new ApiXUrlQueryParameter('filters', mockValidator, arrayProcessor),
      new ApiXUrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        id: '001ABC',
        filters: '',
      }
    } as unknown as Request;

    const processor = new ApiXInputUrlQueryParameterProcessor<MyQueryParams>();
    const schema = processor.process(req, queryParameters);
    expect(schema).toEqual({
      id: '001ABC',
    });
  });

  it('Throws an error when there are invalid parameters', () => {
    interface MyQueryParams extends ApiXRequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    mockValidator = {
      isValid: jest.fn().mockReturnValue(false)
    };

    const arrayProcessor: jest.Mocked<ApiXUrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new ApiXUrlQueryParameter('id', mockValidator, mockProcessor, true),
      new ApiXUrlQueryParameter('filters', mockValidator, arrayProcessor),
      new ApiXUrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        id: 'XXXX',
        filters: 'group,title,description',
        sortBy: 'title'
      }
    } as unknown as Request;

    const processor = new ApiXInputUrlQueryParameterProcessor<MyQueryParams>();
    expect(() => processor.process(req, queryParameters)).toThrow(InvalidParameterError);
    expect(() => processor.process(req, queryParameters)).toThrow('Parameter id has an invalid value: XXXX');
  });

  it('Throws an error when there are missing required parameters', () => {
    interface MyQueryParams extends ApiXRequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    mockValidator = {
      isValid: jest.fn().mockReturnValue(false)
    };

    const arrayProcessor: jest.Mocked<ApiXUrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new ApiXUrlQueryParameter('id', mockValidator, mockProcessor, true),
      new ApiXUrlQueryParameter('filters', mockValidator, arrayProcessor),
      new ApiXUrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        filters: 'group,title,description',
        sortBy: 'title'
      }
    } as unknown as Request;

    const processor = new ApiXInputUrlQueryParameterProcessor<MyQueryParams>();
    expect(() => processor.process(req, queryParameters)).toThrow(MissingRequiredParameterError);
    expect(() => processor.process(req, queryParameters)).toThrow('Missing required parameter id');
  });
});
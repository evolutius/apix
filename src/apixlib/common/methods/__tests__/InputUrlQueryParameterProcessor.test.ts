/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InvalidParameterError,
  MissingRequiredParameterError,
  UrlQueryParameter
} from '../UrlQueryParameter';
import { InputUrlQueryParameterProcessor } from '../InputUrlQueryParameterProcessor';
import { Request } from 'express';
import { RequestInputSchema } from '../RequestInputSchema';
import { UrlQueryParameterProcessor } from '../UrlQueryParameterProcessor';
import { UrlQueryParameterValidator } from '../UrlQueryParameterValidator';

describe('InputQueryParameterProcessor', () => {
  let mockValidator: jest.Mocked<UrlQueryParameterValidator>;
  let mockProcessor: jest.Mocked<UrlQueryParameterProcessor<any>>;

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
    interface MyQueryParams extends RequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    const arrayProcessor: jest.Mocked<UrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new UrlQueryParameter('id', mockValidator, mockProcessor, true),
      new UrlQueryParameter('filters', mockValidator, arrayProcessor),
      new UrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        id: '001ABC',
        filters: 'group,lang,age',
        sortBy: 'title'
      }
    } as unknown as Request;

    const processor = new InputUrlQueryParameterProcessor<MyQueryParams>();
    const schema = processor.process(req, queryParameters);
    expect(schema).toEqual({
      id: '001ABC',
      filters: ['group', 'lang', 'age'],
      sortBy: 'title'
    });
  });

  it('Correctly returns interface with missing or empty optional parameters', () => {
    interface MyQueryParams extends RequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    const arrayProcessor: jest.Mocked<UrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new UrlQueryParameter('id', mockValidator, mockProcessor, true),
      new UrlQueryParameter('filters', mockValidator, arrayProcessor),
      new UrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        id: '001ABC',
        filters: '',
      }
    } as unknown as Request;

    const processor = new InputUrlQueryParameterProcessor<MyQueryParams>();
    const schema = processor.process(req, queryParameters);
    expect(schema).toEqual({
      id: '001ABC',
    });
  });

  it('Throws an error when there are invalid parameters', () => {
    interface MyQueryParams extends RequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    mockValidator = {
      isValid: jest.fn().mockReturnValue(false)
    };

    const arrayProcessor: jest.Mocked<UrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new UrlQueryParameter('id', mockValidator, mockProcessor, true),
      new UrlQueryParameter('filters', mockValidator, arrayProcessor),
      new UrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        id: 'XXXX',
        filters: 'group,title,description',
        sortBy: 'title'
      }
    } as unknown as Request;

    const processor = new InputUrlQueryParameterProcessor<MyQueryParams>();
    expect(() => processor.process(req, queryParameters)).toThrow(InvalidParameterError);
    expect(() => processor.process(req, queryParameters)).toThrow('Parameter id has an invalid value: XXXX');
  });

  it('Throws an error when there are missing required parameters', () => {
    interface MyQueryParams extends RequestInputSchema {
      readonly id: string;
      readonly filters?: Array<string>;
      readonly sortBy?: string;
    }

    mockValidator = {
      isValid: jest.fn().mockReturnValue(false)
    };

    const arrayProcessor: jest.Mocked<UrlQueryParameterProcessor<Array<string>>> = {
      process: jest.fn().mockImplementation((name: string, value: string): [string, Array<string>] => {
        return [name, value.split(',')];
      })
    };

    const queryParameters = [
      new UrlQueryParameter('id', mockValidator, mockProcessor, true),
      new UrlQueryParameter('filters', mockValidator, arrayProcessor),
      new UrlQueryParameter('sortBy', mockValidator, mockProcessor)
    ];

    const req = {
      query: {
        filters: 'group,title,description',
        sortBy: 'title'
      }
    } as unknown as Request;

    const processor = new InputUrlQueryParameterProcessor<MyQueryParams>();
    expect(() => processor.process(req, queryParameters)).toThrow(MissingRequiredParameterError);
    expect(() => processor.process(req, queryParameters)).toThrow('Missing required parameter id');
  });
});
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InvalidParameterError,
  MissingRequiredParameterError,
  UrlQueryParameter
} from '../UrlQueryParameter';
import { Request } from 'express';
import { UrlQueryParameterProcessor } from '../UrlQueryParameterProcessor';
import { UrlQueryParameterValidator } from '../UrlQueryParameterValidator';

describe(`UrlQueryParameter`, () => {
  let mockValidator: jest.Mocked<UrlQueryParameterValidator>;
  let mockProcessor: jest.Mocked<UrlQueryParameterProcessor<any>>;

  beforeEach(() => {
    mockValidator = {
      isValid: jest.fn().mockReturnValue(true)
    };

    mockProcessor = {
      process: jest.fn()
    };
  });

  it('missing or empty required parameters lead to errors', () => {
    const req = {
      query: {
        emptyParam: '',
        param2: 'val2'
      }
    } as unknown as Request;

    let queryParam = new UrlQueryParameter(
      'missingParam',
      mockValidator,
      mockProcessor,
      true
    );

    expect(() => queryParam.get(req)).toThrow(MissingRequiredParameterError);
    expect(() => queryParam.get(req)).toThrow('Missing required parameter missingParam');

    queryParam = new UrlQueryParameter(
      'emptyParam',
      mockValidator,
      mockProcessor,
      true
    );

    expect(() => queryParam.get(req)).toThrow(MissingRequiredParameterError);
    expect(() => queryParam.get(req)).toThrow('Missing required parameter emptyParam');
  });

  it('missing or empty optional parameters return undefined', () => {
    const req = {
      query: {
        emptyParam: '',
        param2: 'val2'
      }
    } as unknown as Request;

    let queryParam = new UrlQueryParameter(
      'missingParam',
      mockValidator,
      mockProcessor
    );

    expect(queryParam.get(req)).toBeUndefined();
    
    queryParam = new UrlQueryParameter(
      'emptyParam',
      mockValidator,
      mockProcessor
    );

    expect(queryParam.get(req)).toBeUndefined();
  });

  it('invalid parameters lead to errors', () => {
    const req = {
      query: {
        invalidParam: '_invalidValue!^',
        param2: 'val2'
      }
    } as unknown as Request;

    mockValidator = {
      isValid: jest.fn().mockReturnValue(false)
    }

    const queryParam = new UrlQueryParameter(
      'invalidParam',
      mockValidator,
      mockProcessor
    );

    expect(() => queryParam.get(req)).toThrow(InvalidParameterError);
    expect(() => queryParam.get(req)).toThrow('Parameter invalidParam has an invalid value: _invalidValue!^');
  });

  it('valid parameters are processed correctly', () => {
    const req = {
      query: {
        arrayParam: 'val0,val1,val2,val3',
        param2: 'val2'
      }
    } as unknown as Request;

    mockProcessor = {
      process: jest.fn().mockImplementation((name: string, val: string): [string, Array<string>] => {
        return [name, val.split(',')];
      })
    }

    const queryParam = new UrlQueryParameter(
      'arrayParam',
      mockValidator,
      mockProcessor
    );

    expect(queryParam.get(req)).toEqual([
      'arrayParam',
      ['val0', 'val1', 'val2', 'val3']
    ]);
  });
});

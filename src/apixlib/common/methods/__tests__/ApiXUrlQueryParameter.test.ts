import { Request } from 'express';
import { ApiXUrlQueryParameter, InvalidParameterError, MissingRequiredParameterError } from '../ApiXUrlQueryParameter';
import { ApiXUrlQueryParameterProcessor } from '../ApiXUrlQueryParameterProcessor';
import { ApiXUrlQueryParameterValidator } from '../ApiXUrlQueryParameterValidator';

describe(`ApiXUrlQueryParameter`, () => {
  let mockValidator: jest.Mocked<ApiXUrlQueryParameterValidator>;
  let mockProcessor: jest.Mocked<ApiXUrlQueryParameterProcessor<any>>;

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

    let queryParam = new ApiXUrlQueryParameter(
      'missingParam',
      mockValidator,
      mockProcessor,
      true
    );

    expect(() => queryParam.get(req)).toThrow(MissingRequiredParameterError);
    expect(() => queryParam.get(req)).toThrow('Missing required parameter missingParam');

    queryParam = new ApiXUrlQueryParameter(
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

    let queryParam = new ApiXUrlQueryParameter(
      'missingParam',
      mockValidator,
      mockProcessor
    );

    expect(queryParam.get(req)).toBeUndefined();
    
    queryParam = new ApiXUrlQueryParameter(
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

    const queryParam = new ApiXUrlQueryParameter(
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

    const queryParam = new ApiXUrlQueryParameter(
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

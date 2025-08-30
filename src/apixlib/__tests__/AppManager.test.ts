/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ApiXConfig, ApiXConfigKey } from '../ApiXConfig';
import { AccessLevel } from '../common/AccessLevel';
import { AccessLevelEvaluator } from '../common/AccessLevelEvaluator';
import { AppManager } from '../AppManager';
import { Cache } from '../common/Cache';
import { DataManager } from '../DataManager';
import { EndpointMethod } from '../common/methods/EndpointMethod';
import { Express } from 'express';
import { HttpBodyValidator } from '../common/methods/HttpBodyValidator';
import { HttpHeaders } from '../common/HttpHeaders';
import { MethodCharacteristic } from '../common/methods/MethodCharacteristic';
import { Request } from '../common/Request';
import { RequestInputSchema } from '../common/methods/RequestInputSchema';
import { UrlQueryParameter } from '../common/methods/UrlQueryParameter';
import { UrlQueryParameterProcessor } from '../common/methods/UrlQueryParameterProcessor';
import { UrlQueryParameterValidator } from '../common/methods/UrlQueryParameterValidator';
import { errorMessages } from '../common/ApiXError';
import request from 'supertest';

describe('Manager', () => {
  let app: Express;
  let appManager: AppManager;
  let mockEvaluator: jest.Mocked<AccessLevelEvaluator>;
  let mockDataManager: jest.Mocked<DataManager>;
  let mockConfig: ApiXConfig;
  let mockCache: jest.Mocked<Cache>;
  let mockValidator: jest.Mocked<UrlQueryParameterValidator>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockProcessor: jest.Mocked<UrlQueryParameterProcessor<any>>;

  beforeEach(() => {
    mockEvaluator = {
      evaluate: jest.fn().mockResolvedValue(AccessLevel.PublicRequestor),
    } as unknown as jest.Mocked<AccessLevelEvaluator>;

    mockDataManager = {
      getAppKeyForApiKey: jest.fn().mockResolvedValue('test-key'),
    };

    mockConfig = new ApiXConfig();

    mockCache = {
      setValueForKey: jest.fn(),
      valueForKey: jest.fn(),
      removeValueForKey: jest.fn()
    };

    mockValidator = {
      isValid: jest.fn().mockReturnValue(true)
    };

    mockProcessor = {
      process: jest.fn().mockImplementation((name, value) => {
        return [name, value];
      })
    };

    appManager = new AppManager(mockEvaluator, mockDataManager, mockConfig, mockCache);
    app = appManager['app']
  });

  it('fails to starts without methods', () => {
    expect(() => {
      appManager.start()
    }).toThrow(Error);
  });

  it('fails to start with no configured port', () => {
    mockConfig.setValueForKey(undefined, ApiXConfigKey.Port);
    expect(() => {
      appManager.start();
    }).toThrow(Error);
  });

  it('fails to add same method more than once', () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });
    expect(() => {
      appManager.registerAppMethod({
        entity: 'entity',
        method: 'method',
        characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
        requestHandler: () => {
          const data = { success: true };
          return { data };
        }
      });
    }).toThrow(Error);
  });

  it('should enforce TLS / HTTPS', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    const response = await request(app).get('/entity/method');
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.insecureProtocol,
      error: {
        id: 'insecureProtocol',
        message: errorMessages.insecureProtocol
      }
    });
  });

  it('should reject requests with missing headers', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    const response = await request(app)
      .get('/entity/method')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date().toUTCString())
      .set(HttpHeaders.ForwardedProto, 'https') /// ensure it doesn't fail for insure protocol

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.missingRequiredHeaders,
      error: {
        id: 'missingRequiredHeaders',
        message: errorMessages.missingRequiredHeaders
      }
    });
  });

  it('should reject requests with empty headers', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    const response = await request(app)
      .get('/entity/method')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date().toUTCString())
      .set(HttpHeaders.Signature, '') /// empty signature
      .set(HttpHeaders.SignatureNonce, 'sigNonce')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.missingRequiredHeaders,
      error: {
        id: 'missingRequiredHeaders',
        message: errorMessages.missingRequiredHeaders
      }
    });
  });

  it('should reject requests with from invalid apps', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    mockDataManager.getAppKeyForApiKey = jest.fn().mockReturnValue(null);

    const response = await request(app)
      .get('/entity/method')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date().toUTCString())
      .set(HttpHeaders.Signature, 'sig')
      .set(HttpHeaders.SignatureNonce, 'sigNonce')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.unauthorizedApp,
      error: {
        id: 'unauthorizedApp',
        message: errorMessages.unauthorizedApp
      }
    });
  });

  it('should reject old requests', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    const response = await request(app)
      .get('/entity/method')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(
        HttpHeaders.Date,
        new Date(
          Date.now()
          - (mockConfig.valueForKey(ApiXConfigKey.MaxRequestAge) as number)
          - 1
        ).toUTCString()
      )
      .set(HttpHeaders.Signature, 'sig')
      .set(HttpHeaders.SignatureNonce, 'sigNonce')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.invalidRequest,
      error: {
        id: 'invalidRequest',
        message: errorMessages.invalidRequest
      }
    });
  });

  it('should reject requests with invalid signatures', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    const response = await request(app)
      .get('/entity/method')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date().toUTCString())
      .set(HttpHeaders.Signature, 'invalidSignature')
      .set(HttpHeaders.SignatureNonce, 'sigNonce')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.invalidRequest,
      error: {
        id: 'invalidRequest',
        message: errorMessages.invalidRequest
      }
    });
  });

  it('attempting to register owned methods without implementation of `requestorOwnsResource` fails', async () => {
    expect(() => appManager.registerAppMethod({
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
    } as unknown as EndpointMethod)).toThrow(`Attempting to register a method that provides owned resources without implementing 'requestorOwnsResource'.`);
  });

  it('should reject requests with insufficient access levels', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]), /// requires `ResourceOwner`
      requestHandler: () => {
        const data = { success: true };
        return { data };
      },
      requestorOwnsResource: () => false
    });

    /// Effectively disable request age 
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .get('/entity/method')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, 'be4b6dc790c201d12609813fdced7ccc8d54b1249dccbfe9ea32fd89e6dd9aae')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.unauthorizedRequest,
      error: {
        id: 'unauthorizedRequest',
        message: errorMessages.unauthorizedRequest
      }
    });
  });

  it('should reject requests with missing request params', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      queryParameters: [
        new UrlQueryParameter('param1', mockValidator, mockProcessor, true),
        new UrlQueryParameter('param2', mockValidator, mockProcessor, true),
      ],
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    /// Effectively disable request age 
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .get('/entity/method?param1=here')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, '9d21edd19fab19fcf1df95573d78962f19271f1213a5111c0f6c8387d0afc724')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Missing required parameter param2',
      error: {
        id: 'invalidRequestParameters',
        message: 'Missing required parameter param2'
      }
    });
  });

  it('should create the same signature with all the same request data and HTTP body differently sorted keys', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      httpMethod: 'POST',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      queryParameters: [
        new UrlQueryParameter('param1', mockValidator, mockProcessor, true),
        new UrlQueryParameter('param2', mockValidator, mockProcessor, true),
      ],
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    /// Effectively disable request age 
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const expectedSignature = '822417805be1ba8c1cdbba85348402579a8d797ce6ec0cfe365dffc21da592f8';

    let response = await request(app)
      .post('/entity/method?param1=here&param2=there')
      .send({
        key1: 'value1',
        key2: {
          subKey1: 'value2',
          subKey2: 'value3',
          subKey3: {
            subSubKey1: 'value4',
            subSubKey2: 'value5'
          },
          subKey4: ['value1', 'value2']
        }
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, expectedSignature)
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    response = await request(app)
      .post('/entity/method?param1=here&param2=there')
      .send({
        key2: {
          subKey2: 'value3',
          subKey1: 'value2',
          subKey4: ['value1', 'value2'],
          subKey3: {
            subSubKey2: 'value5',
            subSubKey1: 'value4'
          }
        },
        key1: 'value1'
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, expectedSignature)
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('should create the different signatures with all the same request and differing URL query parameters', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      httpMethod: 'POST',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      queryParameters: [
        new UrlQueryParameter('param1', mockValidator, mockProcessor, true),
        new UrlQueryParameter('param2', mockValidator, mockProcessor, true),
      ],
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    /// Effectively disable request age 
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const expectedSignature = 'dbd08bfca5d3160c0daf4c07a886975f4a99343e4eadc78976fd3faf947cdbdc';

    let response = await request(app)
      .post('/entity/method?param1=Hello&param2=World')
      .send({
        key1: 'value1',
        key2: {
          subKey1: 'value2',
          subKey2: 'value3',
          subKey3: {
            subSubKey1: 'value4',
            subSubKey2: 'value5'
          },
          subKey4: ['value1', 'value2']
        }
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, expectedSignature)
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    response = await request(app)
      .post('/entity/method?param1=hello&param2=world')
      .send({
        key2: {
          subKey2: 'value3',
          subKey1: 'value2',
          subKey4: ['value1', 'value2'],
          subKey3: {
            subSubKey2: 'value5',
            subSubKey1: 'value4'
          }
        },
        key1: 'value1'
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, expectedSignature)
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ 
      success: false,
      message: errorMessages.invalidRequest,
      error: {
        id: 'invalidRequest',
        message: errorMessages.invalidRequest
      }
    });
  });

  it('should reject requests with invalid request params', async () => {
    mockValidator = {
      isValid: jest.fn().mockReturnValue(false)
    };

    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      queryParameters: [
        new UrlQueryParameter('param1', mockValidator, mockProcessor, true),
        new UrlQueryParameter('param2', mockValidator, mockProcessor),
      ],
      requestHandler: () => {
        const data = { success: true };
        return { data };
      }
    });

    /// Effectively disable request age 
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .get('/entity/method?param1=here')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, '9d21edd19fab19fcf1df95573d78962f19271f1213a5111c0f6c8387d0afc724')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Parameter param1 has an invalid value: here',
      error: {
        id: 'invalidRequestParameters',
        message: 'Parameter param1 has an invalid value: here'
      }
    });
  });

  it('should fulfill valid get requests', async () => {
    interface QueryParams extends RequestInputSchema {
      readonly message: string;
    }

    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      queryParameters: [
        new UrlQueryParameter('message', mockValidator, mockProcessor, true)
      ],
      requestHandler: (request: Request<QueryParams>) => {
        const data = { success: true, message: request.queryParameters?.message };
        return { data };
      }
    });

    /// Effectively disable request age 
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .get('/entity/method?message=This%20passed')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, 'cb78ce350cd07ad6d8cf0738c83b66139bd9ac3db742e8185ecadc4c4deddb81')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'This passed'
    });
  });

  it('should reject duplicate valid signatures', async () => {
    /// Ensure we have a cache
    const dataObject: Record<string, string> = {};
    mockCache.setValueForKey = jest.fn().mockImplementation((value: string, key: string) => {
      dataObject[key] = value;
    });

    mockCache.valueForKey = jest.fn().mockImplementation((key: string) => {
      return dataObject[key];
    });

    interface QueryParams extends RequestInputSchema {
      readonly message: string;
    }

    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      queryParameters: [
        new UrlQueryParameter('message', mockValidator, mockProcessor, true)
      ],
      requestHandler: (request: Request<QueryParams>) => {
        const data = { success: true, message: request.queryParameters?.message };
        return { data }
      }
    });

    /// Effectively disable request age 
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    let response = await request(app)
      .get('/entity/method?message=This%20passed')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, 'cb78ce350cd07ad6d8cf0738c83b66139bd9ac3db742e8185ecadc4c4deddb81')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'This passed'
    });

    /// Exact same request is duplicated
    response = await request(app)
      .get('/entity/method?message=This%20passed')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, 'cb78ce350cd07ad6d8cf0738c83b66139bd9ac3db742e8185ecadc4c4deddb81')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.invalidRequest,
      error: {
        id: 'invalidRequest',
        message: errorMessages.invalidRequest
      }
    });
  });

  it('should reject requests with missing http body when required', async () => {
    interface RequestBody extends RequestInputSchema {
      readonly postId: string;
      readonly content: string;
    }

    appManager.registerAppMethod({
      entity: 'posts',
      method: 'edit',
      httpMethod: 'POST',
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestHandler: (request) => {
        const body = request.jsonBody!;
        const data = { success: true, message: `Modifying post with ID: ${body.postId} to content: ${body.content}` };
        return { data };
      },
      jsonBodyRequired: true,
      requestorOwnsResource: () => true
    } as EndpointMethod<object, RequestBody>);

    mockEvaluator.evaluate = jest.fn().mockReturnValue(AccessLevel.ResourceOwner);

    /// Effectively disable request age
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .post('/posts/edit')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, '2c36f48aec7e8d6bb011bed974867e1ea84b013026b7396d7f0b45ea3fbdd67f')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.missingJsonBody,
      error: {
        id: 'missingJsonBody',
        message: errorMessages.missingJsonBody
      }
    });
  });

  it('should fulfill request with missing non-required body with a validator', async () => {
    interface RequestBody extends RequestInputSchema {
      readonly postId: string;
      readonly content: string;
    }

    const mockBodyValidator: jest.Mocked<HttpBodyValidator<RequestBody>> = {
      isValid: jest.fn().mockReturnValue(false)
    };

    appManager.registerAppMethod({
      entity: 'posts',
      method: 'edit',
      httpMethod: 'POST',
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestHandler: (request) => {
        const body = request.jsonBody;
        if (body) {
          const data = { success: true, message: `Modifying post with ID: ${body.postId} to content: ${body.content}` };
          return { data };
        } else {
          const data = {
            success: true,
            message: 'body missing!'
          }
          return { data };
        }
      },
      jsonBodyRequired: false,
      jsonBodyValidator: mockBodyValidator,
      requestorOwnsResource: () => true
    });

    mockEvaluator.evaluate = jest.fn().mockReturnValue(AccessLevel.ResourceOwner);

    /// Effectively disable request age
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .post('/posts/edit')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, '2c36f48aec7e8d6bb011bed974867e1ea84b013026b7396d7f0b45ea3fbdd67f')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'body missing!'
    });
  });

  it('should reject requests with with invalid json bodies', async () => {
    interface RequestBody extends RequestInputSchema {
      readonly postId: string;
      readonly content: string;
    }

    const mockBodyValidator: jest.Mocked<HttpBodyValidator<RequestBody>> = {
      isValid: jest.fn().mockReturnValue(false)
    };

    appManager.registerAppMethod({
      entity: 'posts',
      method: 'edit',
      httpMethod: 'POST',
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestHandler: (request) => {
        const body = request.jsonBody!;
        const data = { success: true, message: `Modifying post with ID: ${body.postId} to content: ${body.content}` };
        return { data };
      },
      jsonBodyRequired: true,
      jsonBodyValidator: mockBodyValidator,
      requestorOwnsResource: () => true
    });

    mockEvaluator.evaluate = jest.fn().mockReturnValue(AccessLevel.ResourceOwner);

    /// Effectively disable request age
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .post('/posts/edit')
      .send({
        postId: '1010',
        content: 'New content!'
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, '49194126176d3c94d615e0ab9bf40478cc60ec8dbc1492efab4d2054ac4ef2a1')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: errorMessages.invalidJsonBody,
      error: {
        id: 'invalidJsonBody',
        message: errorMessages.invalidJsonBody
      }
    });
  });

  it('should fulfill valid post requests', async () => {
    appManager.registerAppMethod({
      entity: 'posts',
      method: 'edit',
      httpMethod: 'POST',
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestHandler: (request) => {
        const body = request.body;
        const data = { success: true, message: `Modifying post with ID: ${body.postId} to content: ${body.content}` };
        return { data };
      },
      requestorOwnsResource: () => true
    });

    mockEvaluator.evaluate = jest.fn().mockReturnValue(AccessLevel.ResourceOwner);

    /// Effectively disable request age
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .post('/posts/edit')
      .send({
        postId: '1010',
        content: 'New post content!'
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, '878e1b3c6712413dc519f6a299644a6fe351d8003fd1ce692344a4c2226c3835')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Modifying post with ID: 1010 to content: New post content!'
    });
  });

  it('should fulfill valid put requests', async () => {
    appManager.registerAppMethod({
      entity: 'posts',
      method: 'new',
      httpMethod: 'PUT',
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestHandler: (request) => {
        const body = request.body;
        const data = {
          success: true,
          post: {
            id: '0',
            content: body.content,
            userId: body.userId
          }
        };
        return { data };
      },
      requestorOwnsResource: () => true
    });

    mockEvaluator.evaluate = jest.fn().mockReturnValue(AccessLevel.ResourceOwner);

    /// Effectively disable request age
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .put('/posts/new')
      .send({
        userId: '1010',
        content: 'New post content!'
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, '4aec2a4ebace530a486d223ef8bdaefb419e27ae7149288397881fb7364f49ad')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      post: {
        userId: '1010',
        content: 'New post content!',
        id: '0'
      }
    });
  });

  it('should fulfill valid delete requests', async () => {
    appManager.registerAppMethod({
      entity: 'posts',
      method: 'delete',
      httpMethod: 'DELETE',
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestHandler: (request) => {
        const body = request.body;
        const data = {
          success: true,
          postId: body.postId
        };
        return { data };
      },
      requestorOwnsResource: () => true
    });

    mockEvaluator.evaluate = jest.fn().mockReturnValue(AccessLevel.ResourceOwner);

    /// Effectively disable request age
    mockConfig.setValueForKey(Infinity, ApiXConfigKey.MaxRequestAge);

    const response = await request(app)
      .delete('/posts/delete')
      .send({
        postId: '1010',
      })
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date('2024-11-10T12:00:00Z').toUTCString())
      .set(HttpHeaders.Signature, 'de4f64f039dcac6476c77e9f3a1ada7ff122b0c0742f208aa7bbb1373bd7150a')
      .set(HttpHeaders.SignatureNonce, '0123456')
      .set(HttpHeaders.ForwardedProto, 'https');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      postId: '1010'
    });
  });

  it('developer mode bypasses verification', async () => {
    appManager.registerAppMethod({
      entity: 'entity',
      method: 'method',
      characteristics: new Set([MethodCharacteristic.PublicUnownedData]),
      requestHandler: (request) => {
        const data = { success: true, message: request.query.message };
        return { data };
      }
    });

    appManager.developerModeEnabled = true;

    const response = await request(app)
      .get('/entity/method?message=This%20passed')
      .set(HttpHeaders.ApiKey, 'some-key')
      .set(HttpHeaders.Date, new Date().toUTCString())
      .set(HttpHeaders.Signature, 'invalidSig')
      .set(HttpHeaders.SignatureNonce, 'nonce')
      .set(HttpHeaders.ForwardedProto, 'http'); /// non-secured

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'This passed'
    });
  });
});
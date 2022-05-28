/* eslint-disable @typescript-eslint/no-unused-vars */
import {ApiXManager} from '../ApiXManager';
import {ApiXMethod} from '../ApiXMethod';
import {ApiXClearanceLevel} from '../common/ApiXClearanceLevel';
import {ApiXJsonDictionary} from '../common/ApiXJsonDictionary';
import {ApiXRequestHandler} from '../ApiXMethod';
import {mockApiXManager} from '../__mocks__/mockApiXManager';
import {mockRequest} from '../__mocks__/mockRequest';
import {Request} from 'express';
import {Response} from 'express';

describe('ApiXManager', () => {
  test('Clearance Levels are correctly verified', () => {
    const appManager: ApiXManager = mockApiXManager();
    const verifyClearanceLevel = appManager['verifyClearanceLevel'];
    expect(verifyClearanceLevel(ApiXClearanceLevel.CL0, ApiXClearanceLevel.CL6)).toBe(false);
    expect(verifyClearanceLevel(ApiXClearanceLevel.CL6, ApiXClearanceLevel.CL0)).toBe(true);
    expect(verifyClearanceLevel(ApiXClearanceLevel.CL6, ApiXClearanceLevel.CL6)).toBe(true);
  });

  test('Empty or undefined appKeys will result in incorrect verification', async () => {
    const appManager: ApiXManager = mockApiXManager();
    expect(await appManager['verifyApp']('someApiKey')).toBe(false);
  });

  test('Non-empty appKeys will result in incorrect verification', async () => {
    const appManager: ApiXManager = mockApiXManager(ApiXClearanceLevel.CL6, 'someAppKey');
    expect(await appManager['verifyApp']('someApiKey')).toBe(true);
  });

  test('Required parameters are correctly verified', () => {
    const appManager: ApiXManager = mockApiXManager();
    const verifyParamsInRequest = appManager['verifyParamsInRequest'];
    const reqParams = [
      'reqParam1',
      'reqParam2',
      'reqParam3',
    ];
    const testParams1: ApiXJsonDictionary<unknown> = {
      param1: 'some value',
      param2: 'some value',
      param3: 'some value',
    }

    const testParams2: ApiXJsonDictionary<unknown> = {
      reqParam1: 'some value',
      reqParam2: 'some value',
      reqParam3: 'some value',
    }

    expect(verifyParamsInRequest(reqParams, testParams1)).toBe(false);
    expect(verifyParamsInRequest(reqParams, testParams2)).toBe(true);
  });

  test('App session verification fails gracefully with invalid parameters', async () => {
    const request = mockRequest();
    const appManager: ApiXManager = mockApiXManager();
    expect(await appManager['verifySession']('', '', request)).toBe(false);
  });

  test('App session verification fails with invalid app session and valid request', async () => {
    const request = mockRequest();
    const appManager: ApiXManager = mockApiXManager();
    expect(await appManager['verifySession']('someApiKey', 'someAppSessionId', request)).toBe(false);
    expect(await appManager['verifySession']('', '', request)).toBe(false);
  });

  test('Test endpoint is built correctly from ApiXMethod', async () => {
    const defaultHandler: ApiXRequestHandler
        = (req: Request, res: Response) => { return { success: true }; };
    const entityAndMethod: ApiXMethod = {
      entity: 'entity',
      method: 'method/',
      requestHandler: defaultHandler
    };
    const entityOnly: ApiXMethod = {
      entity: '/entity',
      method: '/',
      requestHandler: defaultHandler
    };
    const methodOnly: ApiXMethod = {
      method: '/method',
      requestHandler: defaultHandler
    };
    const noEntityOrMethod: ApiXMethod = {
      method: '',
      requestHandler: defaultHandler
    };
    const appManager: ApiXManager = mockApiXManager();
    const endpointForMethod = appManager['endpointForMethod'];
    expect(endpointForMethod(entityAndMethod)).toBe('/entity/method');
    expect(endpointForMethod(entityOnly)).toBe('/entity');
    expect(endpointForMethod(methodOnly)).toBe('/method');
    expect(endpointForMethod(noEntityOrMethod)).toBe('/');
  });

  test('Test endpoint is the same reguardless of syntax', async () => {
    const defaultHandler: ApiXRequestHandler
        = (req: Request, res: Response) => { return { success: true }; };
    const method1: ApiXMethod = {
      entity: 'entity',
      method: 'method/',
      requestHandler: defaultHandler
    };
    const method2: ApiXMethod = {
      entity: '/entity',
      method: '/method',
      requestHandler: defaultHandler
    };
    const method3: ApiXMethod = {
      entity: 'entity/method',
      method: '/',
      requestHandler: defaultHandler
    };
    const method4: ApiXMethod = {
      method: 'entity/method',
      requestHandler: defaultHandler
    };

    const appManager: ApiXManager = mockApiXManager();
    const endpointForMethod = appManager['endpointForMethod'];
    expect(endpointForMethod(method1)).toBe(endpointForMethod(method2));
    expect(endpointForMethod(method2)).toBe(endpointForMethod(method3));
    expect(endpointForMethod(method3)).toBe(endpointForMethod(method4));
  });

  test('Test method registration does not allow same endpoint with same http method', async () => {
    const defaultHandler: ApiXRequestHandler
        = (req: Request, res: Response) => { return { success: true }; };
    const method1: ApiXMethod = {
      entity: 'entity',
      method: 'method/',
      requestHandler: defaultHandler
    };
    const method2: ApiXMethod = {
      entity: '/entity',
      method: '/method',
      requestHandler: defaultHandler
    };

    const appManager: ApiXManager = mockApiXManager();
    try {
      appManager.registerAppMethod(method1);
    } catch {
      fail('First ethod failed registration');
    }

    try {
      appManager.registerAppMethod(method2);
      fail('Second method succeeded registration')
    } catch {
      // We want this to throw
    }
  });

  test('Test method registration allows same endpoint with difference http method', async () => {
    const defaultHandler: ApiXRequestHandler
        = (req: Request, res: Response) => { return { success: true }; };
    const method1: ApiXMethod = {
      entity: 'entity',
      method: 'method/',
      requestHandler: defaultHandler
    };
    const method2: ApiXMethod = {
      entity: '/entity',
      method: '/method',
      httpMethod: 'POST',
      requestHandler: defaultHandler
    };

    const appManager: ApiXManager = mockApiXManager();
    try {
      appManager.registerAppMethod(method1);
    } catch {
      fail('First method failed registration');
    }

    try {
      appManager.registerAppMethod(method2);
    } catch {
      fail('Method failed registration with same endpoint but different http method');
    }
  });

  test('App does not run without registered methods', () => {
    const appManager = mockApiXManager();
    try {
      appManager.run();
      fail('App is running and it should not.');
    } catch {
      // We want it to throw
    }
  });

  test('App does not run without registered methods', () => {
    const defaultHandler: ApiXRequestHandler
        = (req: Request, res: Response) => { return { success: true }; };
    const method: ApiXMethod = {
      entity: 'entity',
      method: 'method',
      requestHandler: defaultHandler
    };
    const appManager = mockApiXManager();
    try {
      appManager.registerAppMethod(method);
    } catch {
      fail('Failed to register app method');
    }
    const appConfig = appManager['appConfig'];
    appConfig.setValueForKey(undefined, 'port');  // undef port
    try {
      appManager.run();
      fail('App is running and it should not.');
    } catch {
      // We want it to throw
    }
  });

  test('App session verification fails no date header', async () => {
    const appKey = 'N2NkM2VjOGFkNDA5MDFlZjBmNDg5NDNjMjk3ZWNkNjg4ZWUzNmM1YmU2ODQ5ZGU2Y2E1MjNhNDY4ZjE5MzY4ZQ==';
    const validSessionId = '11460dc55c56ccd49ad9d2edcdc38559fef09dd0175eacaa9cfd35b1538ef003';
    const httpBody = {param1: 'value1', param2: 'value2'};
    const request = mockRequest(undefined, httpBody);
    request.headers.date = undefined;
    const appManager: ApiXManager = mockApiXManager(ApiXClearanceLevel.CL6, appKey, '', true);
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(false);
  });

  test('App session verification fails with old date', async () => {
    const appKey = 'N2NkM2VjOGFkNDA5MDFlZjBmNDg5NDNjMjk3ZWNkNjg4ZWUzNmM1YmU2ODQ5ZGU2Y2E1MjNhNDY4ZjE5MzY4ZQ==';
    const dateString = 'Mon, 09 Mar 2020 08:13:24 GMT';
    const validSessionId = '11460dc55c56ccd49ad9d2edcdc38559fef09dd0175eacaa9cfd35b1538ef003';
    const httpBody = {param1: 'value1', param2: 'value2'};
    const request = mockRequest(dateString, httpBody);
    const appManager: ApiXManager = mockApiXManager(ApiXClearanceLevel.CL6, appKey, '', true);
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(false);
  });

  test('App session verification succeeds with valid app session', async () => {
    const appKey = 'N2NkM2VjOGFkNDA5MDFlZjBmNDg5NDNjMjk3ZWNkNjg4ZWUzNmM1YmU2ODQ5ZGU2Y2E1MjNhNDY4ZjE5MzY4ZQ==';
    const dateString = 'Mon, 09 Mar 2020 08:13:24 GMT';
    const validSessionId = '11460dc55c56ccd49ad9d2edcdc38559fef09dd0175eacaa9cfd35b1538ef003';
    const httpBody = {param1: 'value1', param2: 'value2'};
    const request = mockRequest(dateString, httpBody);
    const appManager: ApiXManager = mockApiXManager(ApiXClearanceLevel.CL6, appKey);
    const mockDateNow = jest.fn().mockReturnValueOnce(new Date(dateString).getTime());
    Date.now = mockDateNow;
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(true);
  });

  test('App session verification succeeds with successive valid app session w/o cache', async () => {
    const appKey = 'N2NkM2VjOGFkNDA5MDFlZjBmNDg5NDNjMjk3ZWNkNjg4ZWUzNmM1YmU2ODQ5ZGU2Y2E1MjNhNDY4ZjE5MzY4ZQ==';
    const dateString = 'Mon, 09 Mar 2020 08:13:24 GMT';
    const validSessionId = '11460dc55c56ccd49ad9d2edcdc38559fef09dd0175eacaa9cfd35b1538ef003';
    const httpBody = {param1: 'value1', param2: 'value2'};
    const request = mockRequest(dateString, httpBody);
    const appManager: ApiXManager = mockApiXManager(ApiXClearanceLevel.CL6, appKey);
    const mockDateNow = jest.fn().mockReturnValueOnce(new Date(dateString).getTime());
    Date.now = mockDateNow;
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(true);
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(true);
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(true);
  });

  jest.setTimeout(30000);
  test('App session verification succeeds with successive valid app session with cache after enough time passes', async () => {
    const appKey = 'N2NkM2VjOGFkNDA5MDFlZjBmNDg5NDNjMjk3ZWNkNjg4ZWUzNmM1YmU2ODQ5ZGU2Y2E1MjNhNDY4ZjE5MzY4ZQ==';
    const dateString = 'Mon, 09 Mar 2020 08:13:24 GMT';
    const validSessionId = '11460dc55c56ccd49ad9d2edcdc38559fef09dd0175eacaa9cfd35b1538ef003';
    const httpBody = {param1: 'value1', param2: 'value2'};
    const request = mockRequest(dateString, httpBody);
    const appManager: ApiXManager = mockApiXManager(ApiXClearanceLevel.CL6, appKey, '', true);
    const appConfig = appManager['appConfig'];
    const evictionTime = appConfig.valueForKey('maxRequestDateDifference') as number;
    const mockDateNow = jest.fn().mockReturnValueOnce(new Date(dateString).getTime());
    Date.now = mockDateNow;
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(true);
    await new Promise((r) => setTimeout(r, evictionTime + 100));
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(true);
  });

  test('App session verification fails with successive valid app session with cache', async () => {
    const appKey = 'N2NkM2VjOGFkNDA5MDFlZjBmNDg5NDNjMjk3ZWNkNjg4ZWUzNmM1YmU2ODQ5ZGU2Y2E1MjNhNDY4ZjE5MzY4ZQ==';
    const dateString = 'Mon, 09 Mar 2020 08:13:24 GMT';
    const validSessionId = '11460dc55c56ccd49ad9d2edcdc38559fef09dd0175eacaa9cfd35b1538ef003';
    const httpBody = {param1: 'value1', param2: 'value2'};
    const request = mockRequest(dateString, httpBody);
    const appManager: ApiXManager = mockApiXManager(ApiXClearanceLevel.CL6, appKey, '', true);
    const mockDateNow = jest.fn().mockReturnValueOnce(new Date(dateString).getTime());
    Date.now = mockDateNow;
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(true);
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(false);
    expect(await appManager['verifySession']('', validSessionId, request)).toBe(false);
  });
});
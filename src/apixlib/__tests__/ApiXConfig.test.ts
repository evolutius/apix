import { ApiXConfig, ApiXConfigKey } from '../ApiXConfig';
import fs from 'fs';

describe('ApiXConfig', () =>{
  test('Test default value in the absense of a file', () => {
    const defaultPort = 3000;
    const defaultMaxRequestAge = 60000;
    const appConfig = new ApiXConfig();
    expect(appConfig.valueForKey(ApiXConfigKey.Port)).toBe(defaultPort);
    expect(appConfig.valueForKey(ApiXConfigKey.MaxRequestAge)).toBe(defaultMaxRequestAge);
  });

  test('Test values can be modified', () => {
    const appConfig = new ApiXConfig();
    const port = 8443;
    appConfig.setValueForKey(port, ApiXConfigKey.Port);
    expect(appConfig.valueForKey(ApiXConfigKey.Port)).toBe(port);
  });

  test('Test files are correctly parsed', () => {
    const port = 8443;
    const maxRequestAge = 3000;
    const someOtherProperty = 'some property';
    const testFileName = 'appConfig.test.json';
    const testFileData = {
      [ApiXConfigKey.Port]: port,
      [ApiXConfigKey.MaxRequestAge]: maxRequestAge,
      someOtherProperty: someOtherProperty
    };
    try {
      // create test file
      fs.writeFileSync(testFileName, JSON.stringify(testFileData), 'utf-8');
    } catch {
      fail('Cannot create or write test file');
    }

    const appConfig = new ApiXConfig(testFileName);

    expect(appConfig.valueForKey(ApiXConfigKey.Port)).toBe(port);
    expect(appConfig.valueForKey(ApiXConfigKey.MaxRequestAge)).toBe(maxRequestAge);
    expect(appConfig.valueForKey('someOtherProperty')).toBe(someOtherProperty);
    expect(appConfig.valueForKey('someUndefinedProperty')).toBeUndefined();

    // delete test file
    try {
      fs.unlinkSync(testFileName);
    } catch {
      fail('Failed to remove test file:' + testFileName);
    }
  });

  test('Test without required configuration use the defaults', () => {
    const port = 3000;
    const maxRequestAge = 60000;
    const someOtherProperty = 'some property';
    const testFileName = 'appConfigNoRequiredData.test.json';
    const testFileData = {
      someOtherProperty: someOtherProperty
    };
    try {
      // create test file
      fs.writeFileSync(testFileName, JSON.stringify(testFileData), 'utf-8');
    } catch {
      fail('Cannot create or write test file');
    }

    const appConfig = new ApiXConfig(testFileName);

    expect(appConfig.valueForKey(ApiXConfigKey.Port)).toBe(port);
    expect(appConfig.valueForKey(ApiXConfigKey.MaxRequestAge)).toBe(maxRequestAge);
    expect(appConfig.valueForKey('someOtherProperty')).toBe(someOtherProperty);

    // delete test file
    try {
      fs.unlinkSync(testFileName);
    } catch {
      fail('Failed to remove test file:' + testFileName);
    }
  });
});
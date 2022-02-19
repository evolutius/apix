import {ApiXConfig} from "../ApiXConfig";
import fs from 'fs';

describe('ApiXConfig', () =>{
  test('Test default value in the absense of a file', () => {
    const defaultPort = 3000;
    const defaultMaxRequestDateDifferece = 5000;
    const defaultAppSessionOnce = true;
    const appConfig = new ApiXConfig();
    expect(appConfig.valueForKey('port')).toBe(defaultPort);
    expect(appConfig.valueForKey('maxRequestDateDifference')).toBe(defaultMaxRequestDateDifferece);
    expect(appConfig.valueForKey('appSessionOnce')).toBe(defaultAppSessionOnce);
  });

  test('Test values can be modified', () => {
    const appConfig = new ApiXConfig();
    const port = 8443;
    appConfig.setValueForKey(port, 'port');
    expect(appConfig.valueForKey('port')).toBe(port);
  });

  test('Test files are correctly parsed', () => {
    const port = 8443;
    const maxRequestDateDifference = 3000;
    const appSessionOnce = false;
    const someOtherProperty = 'some property';
    const testFileName = 'appConfig.test.json';
    const testFileData = {
      port: port,
      maxRequestDateDifference: maxRequestDateDifference,
      appSessionOnce: appSessionOnce,
      someOtherProperty: someOtherProperty
    };
    try {
      // create test file
      fs.writeFileSync(testFileName, JSON.stringify(testFileData), 'utf-8');
    } catch {
      fail('Cannot create or write test file');
    }

    const appConfig = new ApiXConfig(testFileName);

    expect(appConfig.valueForKey('port')).toBe(port);
    expect(appConfig.valueForKey('maxRequestDateDifference')).toBe(maxRequestDateDifference);
    expect(appConfig.valueForKey('appSessionOnce')).toBe(appSessionOnce);
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
    const maxRequestDateDifference = 5000;
    const appSessionOnce = true;
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

    expect(appConfig.valueForKey('port')).toBe(port);
    expect(appConfig.valueForKey('maxRequestDateDifference')).toBe(maxRequestDateDifference);
    expect(appConfig.valueForKey('appSessionOnce')).toBe(appSessionOnce);
    expect(appConfig.valueForKey('someOtherProperty')).toBe(someOtherProperty);

    // delete test file
    try {
      fs.unlinkSync(testFileName);
    } catch {
      fail('Failed to remove test file:' + testFileName);
    }
  });
});
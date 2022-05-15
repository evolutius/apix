import {Request} from 'express';
import {ApiXJsonDictionary} from '../common/ApiXJsonDictionary';

export function mockRequest(dateString?: string, httpBody?: ApiXJsonDictionary<unknown>, salt?: string): Request {
  return {
    headers: {
      date: dateString || 'Wed, 21 Oct 2015 07:28:00 GMT',
    },
    body: httpBody || {
      param1: 'some value',
      param2: 'some value',
      param3: true,
      param4: 3.14159
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    header: (name: string) => { return salt; }
  } as Request;
}

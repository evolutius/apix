/* eslint-disable no-unused-vars */
import {ApiXMethod} from '../ApiXMethod';
import {Request} from 'express';

export enum ApiXClearanceLevel {
  CL0 = 0,
  CL1,
  CL2,
  CL3,
  CL4,
  CL5,
  CL6
}

export interface ApiXClearanceLevelDeterminator {
  determine(appMethod: ApiXMethod, req: Request): ApiXClearanceLevel | Promise<ApiXClearanceLevel>;
}

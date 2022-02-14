/* eslint-disable no-unused-vars */
import {AppMethod} from '../AppMethod';
import {Request} from 'express';

export enum ClearanceLevel {
  CL0 = 0,
  CL1,
  CL2,
  CL3,
  CL4,
  CL5,
  CL6
}

export interface ClearanceLevelDeterminator {
  determine(appMethod: AppMethod, req: Request): ClearanceLevel;
}

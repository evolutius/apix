import {Request, Response} from 'express';
import {ApiXClearanceLevel} from './sec/ApiXClearanceLevel';

export type ApiXRequestHandler = (req: Request, res: Response) => unknown;

export interface ApiXAppMethod {
  entity: string;
  method: string;
  requiredCl: ApiXClearanceLevel;
  httpMethod: string;
  requiredParams: string[];
  requestHandler: ApiXRequestHandler;
}

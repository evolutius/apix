import {Request, Response} from 'express';
import {ApiXClearanceLevel} from './sec/ApiXClearanceLevel';

export type ApiXRequestHandler = (req: Request, res: Response) => unknown;

export interface ApiXMethod {
  entity?: string;
  method: string;
  requestHandler: ApiXRequestHandler;
  httpMethod?: string;
  requiredParams?: string[];
  requiredClearanceLevel?: ApiXClearanceLevel;
}

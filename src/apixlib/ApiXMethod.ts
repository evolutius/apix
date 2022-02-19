import {Request, Response} from 'express';
import {ApiXClearanceLevel} from './common/ApiXClearanceLevel';

export type ApiXRequestHandler = (req: Request, res: Response) => unknown;

export interface ApiXMethod {
  entity?: string;
  method: string;
  requestHandler: ApiXRequestHandler;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL';
  requiredParams?: string[];
  requiredClearanceLevel?: ApiXClearanceLevel;
}

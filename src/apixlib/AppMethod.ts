import {Request, Response} from 'express';
import {ClearanceLevel} from './sec/ClearanceLevel';

export type RequestHandler = (req: Request, res: Response) => unknown;

export interface AppMethod {
  entity: string;
  method: string;
  requiredCl: ClearanceLevel;
  httpMethod: string;
  requiredParams: string[];
  requestHandler: RequestHandler;
}

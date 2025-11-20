import { Request } from 'express';
import { UserPayload } from './auth.types';

export interface RequestWithUser extends Request {
  user: UserPayload;
}

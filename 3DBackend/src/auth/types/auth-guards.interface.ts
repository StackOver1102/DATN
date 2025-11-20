import { CanActivate, Type } from '@nestjs/common';

export interface AuthGuards {
  jwt: Type<CanActivate>;
  roles: Type<CanActivate>;
}

export interface GuardOptions {
  global?: boolean;
  defaultStrategy?: string;
}

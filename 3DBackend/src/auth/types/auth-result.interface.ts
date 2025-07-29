import { User } from 'src/users/types/user.types';

export interface AuthResult {
  user: User;
  token: string;
}

export interface AuthError {
  message: string;
  statusCode: number;
}

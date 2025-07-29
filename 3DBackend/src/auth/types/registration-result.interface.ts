import { User } from 'src/users/types/user.types';

export interface RegistrationResult {
  success: boolean;
  user?: User;
  message?: string;
}

export interface RegistrationError {
  message: string;
  field?: string;
  statusCode: number;
}

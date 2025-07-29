import { Document } from 'mongoose';
import { UserRole } from 'src/enum/user.enum';

export interface User {
  _id?: string | number;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  address: string;
  phone: string;
  isDeleted?: boolean;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = User & Document;

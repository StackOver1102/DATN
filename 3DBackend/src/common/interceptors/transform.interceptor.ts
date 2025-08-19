import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';

interface ResponseData {
  message?: string;
  data?: any;
  [key: string]: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data: ResponseData) => {
        const transformedResponse: ApiResponse<T> = {
          success: statusCode < 400,
          message: data?.message || 'Thành công',
          timestamp: new Date().getTime(),
          statusCode,
          data: (data?.data || data) as unknown as T,
        };
        return transformedResponse;
      }),
    );
  }
}

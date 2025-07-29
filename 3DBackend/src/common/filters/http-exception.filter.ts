import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = exception.getResponse();
    const errorMessage =
      typeof errorResponse === 'object' && 'message' in errorResponse
        ? errorResponse.message
        : exception.message || 'Đã xảy ra lỗi';

    response.status(status).json({
      success: false,
      message: Array.isArray(errorMessage)
        ? (errorMessage[0] as string)
        : (errorMessage as string),
      data: null,
      timestamp: new Date().getTime(),
      statusCode: status,
    });
  }
}

import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../interfaces/response.interface';

export abstract class BaseController {
  /**
   * Tạo response thành công
   */
  public success<T>(data: T, message = 'Thành công'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().getTime(),
      statusCode: HttpStatus.OK,
    };
  }

  /**
   * Tạo response thành công với mã trạng thái tùy chỉnh
   */
  public successWithStatus<T>(
    data: T,
    statusCode: HttpStatus,
    message = 'Thành công',
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().getTime(),
      statusCode,
    };
  }

  /**
   * Tạo response lỗi
   */
  public error<T = null>(
    message = 'Đã xảy ra lỗi',
    statusCode = HttpStatus.BAD_REQUEST,
    data: T = null as unknown as T,
  ): ApiResponse<T> {
    return {
      success: false,
      message,
      data,
      timestamp: new Date().getTime(),
      statusCode,
    };
  }
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
  statusCode: number;
}

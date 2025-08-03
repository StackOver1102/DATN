export interface PaginatedResult<T> {
    items: T[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
  statusCode: number;
}

import { Injectable } from '@nestjs/common';
import { FilterDto } from '../dto/filter.dto';
import { PaginatedResult } from '../interfaces/pagination.interface';
import { Model, Document, FilterQuery, SortOrder } from 'mongoose';

@Injectable()
export class FilterService {
  /**
   * Apply filters and pagination to a Mongoose query
   * @param model Mongoose model
   * @param filterDto Filter and pagination parameters
   * @param baseQuery Base query to apply filters to
   * @param searchFields Fields to search in when search parameter is provided
   * @returns Paginated result with items and metadata
   */
  async applyFilters<T extends Document>(
    model: Model<T>,
    filterDto: FilterDto,
    baseQuery: FilterQuery<T> = {},
    searchFields: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      search,
      subSearch,
      categoryName,
      categoryPath,
      sortBy,
      sortDirection = 'desc',
    } = filterDto;
    const skip = (page - 1) * limit;

    // Build the query
    let query = { ...baseQuery };
    const orConditions: Record<string, any>[] = [];
    const andConditions: Record<string, any>[] = [];

    // Add search conditions if provided
    if (search && searchFields.length > 0) {
      const searchRegex = new RegExp(search, 'i');
      const searchQuery = searchFields.map((field) => ({
        [field]: searchRegex,
      }));
      // Thêm điều kiện tìm kiếm vào mảng OR
      orConditions.push(...searchQuery);
    }

    // Thêm điều kiện tìm kiếm theo danh mục vào mảng OR
    if (subSearch) {
      const subSearchRegex = new RegExp(subSearch, 'i');
      orConditions.push({ categoryPath: subSearchRegex });
    }

    // Thêm điều kiện tìm kiếm theo categoryName và categoryPath vào mảng AND
    if (categoryName) {
      const categoryNameRegex = new RegExp(categoryName, 'i');
      andConditions.push({ categoryName: categoryNameRegex });
    }

    if (categoryPath) {
      const categoryPathRegex = new RegExp(categoryPath, 'i');
      andConditions.push({ categoryPath: categoryPathRegex });
    }

    // Kết hợp các điều kiện AND và OR
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    if (andConditions.length > 0) {
      // Kết hợp các điều kiện AND với nhau
      if (andConditions.length === 1) {
        // Nếu chỉ có một điều kiện AND, thêm trực tiếp vào query
        query = { ...query, ...andConditions[0] };
      } else {
        // Nếu có nhiều điều kiện AND, sử dụng $and
        query.$and = andConditions;
      }
    }

    // Create the sort object
    const sort: Record<string, SortOrder> = sortBy
      ? { [sortBy]: sortDirection === 'asc' ? 1 : -1 }
      : { createdAt: -1 };

    // Execute queries
    const [items, totalItems] = await Promise.all([
      model.find(query).sort(sort).skip(skip).limit(limit).exec(),
      model.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}

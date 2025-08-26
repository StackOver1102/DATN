import { Injectable } from '@nestjs/common';
import { FilterDto } from '../dto/filter.dto';
import { PaginatedResult } from '../interfaces/pagination.interface';
import {
  Model,
  Document,
  FilterQuery,
  SortOrder,
  PopulateOptions,
} from 'mongoose';

@Injectable()
export class FilterService {
  /**
   * Apply filters and pagination to a Mongoose query
   * @param model Mongoose model
   * @param filterDto Filter and pagination parameters
   * @param baseQuery Base query to apply filters to
   * @param searchFields Fields to search in when search parameter is provided
   * @param populateOptions Options for populating references in the query results
   * @returns Paginated result with items and metadata
   */
  async applyFilters<T extends Document>(
    model: Model<T>,
    filterDto: FilterDto,
    baseQuery: FilterQuery<T> = {},
    searchFields: string[] = [],
    populateOptions?: PopulateOptions,
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      search,
      q,
      subSearch,
      categoryName,
      sortBy,
      sortDirection = 'asc',
      // Extract additional filter fields
      style,
      materials,
      render,
      form,
      color,
      price,
      discount,
      isPro,
    } = filterDto;

    // Use q parameter as search if provided
    const searchTerm = q || search;
    const skip = (page - 1) * limit;

    // Build the query
    let query = { ...baseQuery };
    const orConditions: Record<string, any>[] = [];
    const andConditions: Record<string, any>[] = [];

    // Add search conditions if provided
    if (searchTerm && searchFields.length > 0) {
      const searchRegex = new RegExp(searchTerm, 'i');
      const searchQuery = searchFields.map((field) => ({
        [field]: searchRegex,
      }));
      // Add search conditions to OR array
      orConditions.push(...searchQuery);
    }

    // Thêm điều kiện tìm kiếm theo danh mục vào mảng OR
    // if (subSearch) {
    //   const subSearchRegex = new RegExp(subSearch, 'i');
    //   orConditions.push({ categoryPath: subSearchRegex });
    // }

    // Thêm điều kiện tìm kiếm theo categoryName và categoryPath vào mảng AND
    if (categoryName) {
      const categoryNameRegex = new RegExp(categoryName, 'i');
      andConditions.push({ categoryPath: categoryNameRegex });
    }

    if (subSearch) {
      // Replace hyphens with spaces and make search case-insensitive
      const subSearchRegex = subSearch.replace(/-/g, ' ');
      // Using 'i' flag for case-insensitive search
      const categoryNameRegex = new RegExp(subSearchRegex, 'i');
      andConditions.push({ categoryName: categoryNameRegex });
    }

    // Process additional filter fields
    // For text fields, use regex for case-insensitive partial matching
    if (style) {
      const styleRegex = new RegExp(style, 'i');
      andConditions.push({ style: styleRegex });
    }

    if (materials) {
      const materialsRegex = new RegExp(materials, 'i');
      andConditions.push({ materials: materialsRegex });
    }

    if (render) {
      const renderRegex = new RegExp(render, 'i');
      andConditions.push({ render: renderRegex });
    }

    if (form) {
      const formRegex = new RegExp(form, 'i');
      andConditions.push({ form: formRegex });
    }

    if (color) {
      const colorRegex = new RegExp(color, 'i');
      andConditions.push({ color: colorRegex });
    }

    // For numeric fields, use exact matching
    if (price !== undefined) {
      andConditions.push({ price });
    }

    if (discount !== undefined) {
      andConditions.push({ discount });
    }

    if (isPro) {
      andConditions.push({ isPro: isPro === 'true' });
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
      : { updatedAt: -1 };

    // Execute queries
    let findQuery = model.find(query).sort(sort).skip(skip).limit(limit);

    // Apply populate if provided
    if (populateOptions) {
      findQuery = findQuery.populate(populateOptions);
    }


    const [items, totalItems] = await Promise.all([
      findQuery.exec(),
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

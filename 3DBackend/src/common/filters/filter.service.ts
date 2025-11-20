import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class FilterService {
  async applyFilters<T>(
    model: Model<T>,
    filters: Record<string, any> = {},
    limit?: number,
    skip?: number,
    sort?: Record<string, 1 | -1>,
  ): Promise<{ results: T[]; total: number }> {
    // Create a query based on the filters
    const query = model.find(filters);

    // Get total count before applying pagination
    const total = await model.countDocuments(filters).exec();

    // Apply pagination if limit is provided
    if (limit) {
      query.limit(limit);
    }

    // Apply skip for pagination
    if (skip) {
      query.skip(skip);
    }

    // Apply sorting if provided
    if (sort) {
      query.sort(sort);
    }

    // Execute the query
    const results = await query.exec();

    return { results, total };
  }
}

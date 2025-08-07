import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Xử lý parentId nếu có
    if (createCategoryDto.parentId) {
      const parentExists = await this.categoryModel
        .findById(createCategoryDto.parentId)
        .exec();

      if (!parentExists) {
        throw new NotFoundException(
          `Danh mục cha với ID ${createCategoryDto.parentId} không tồn tại`,
        );
      }
    }

    const createdCategory = new this.categoryModel(createCategoryDto);
    return createdCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findOne(id: string): Promise<Category> {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) {
      throw new NotFoundException('ID danh mục không hợp lệ');
    }

    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) {
      throw new NotFoundException('ID danh mục không hợp lệ');
    }

    // Xử lý parentId nếu có
    if (updateCategoryDto.parentId) {
      const parentExists = await this.categoryModel
        .findById(updateCategoryDto.parentId)
        .exec();

      if (!parentExists) {
        throw new NotFoundException(
          `Danh mục cha với ID ${updateCategoryDto.parentId} không tồn tại`,
        );
      }
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
    }

    return updatedCategory;
  }

  async remove(id: string): Promise<Category> {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) {
      throw new NotFoundException('ID danh mục không hợp lệ');
    }

    const deletedCategory = await this.categoryModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedCategory) {
      throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
    }
    return deletedCategory;
  }

  // Phương thức bổ sung: Tìm tất cả danh mục con
  async findChildren(parentId: string): Promise<Category[]> {
    return this.categoryModel.find({ parentId }).exec();
  }

  // Phương thức bổ sung: Tìm tất cả danh mục gốc (không có danh mục cha)
  async findRootCategories(): Promise<Category[]> {
    return this.categoryModel.find({ parentId: null }).exec();
  }

  async getAllCategoriesGroupByParentId(): Promise<any[]> {
    // First, get all root categories (those with parentId = null)
    const rootCategories = await this.categoryModel
      .find({ parentId: null })
      .exec();

    // For each root category, find its children and format the result
    const result = await Promise.all(
      rootCategories.map(async (rootCategory) => {
        // Find all children of this root category
        const children = await this.categoryModel
          .find({ parentId: rootCategory._id.toString() })
          .exec();

        // Format the children to have only the required fields
        const items = children.map((child) => ({
          name: child.name,
          _id: child._id,
        }));

        // Return the formatted object with title and items
        return {
          title: rootCategory.name,
          _id: rootCategory._id,
          items,
        };
      }),
    );

    return result;
  }

  async getCategoryParent(): Promise<Category[]> {
    const category = await this.categoryModel.find({ parentId: null }).exec();
    return category;
  }
}

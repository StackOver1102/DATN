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
  ) { }

  /**
   * Tạo danh mục mới.
   * - Nếu có parentId, kiểm tra danh mục cha có tồn tại không.
   * 
   * @param {CreateCategoryDto} createCategoryDto - Thông tin danh mục.
   * @param {string} createCategoryDto.name - Tên danh mục.
   * @param {string} [createCategoryDto.parentId] - ID danh mục cha (optional, null = root).
   * @param {string} [createCategoryDto.description] - Mô tả.
   * @param {string} [createCategoryDto.image] - URL ảnh đại diện.
   * @returns {Promise<Category>} - Danh mục đã tạo.
   * 
   * @example
   * // Tạo danh mục gốc:
   * const root = await categoriesService.create({ name: "Nội thất" });
   * 
   * // Tạo danh mục con:
   * const child = await categoriesService.create({ name: "Ghế", parentId: root._id });
   */
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

  /**
   * Lấy tất cả danh mục.
   * 
   * @returns {Promise<Category[]>} - Mảng tất cả danh mục.
   * 
   * @example
   * const allCategories = await categoriesService.findAll();
   */
  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  /**
   * Lấy chi tiết một danh mục.
   * 
   * @param {string} id - ID danh mục (MongoDB ObjectId).
   * @returns {Promise<Category>}
   * @throws {NotFoundException} - Nếu ID không hợp lệ hoặc không tìm thấy.
   * 
   * @example
   * const category = await categoriesService.findOne("507f1f77bcf86cd799439011");
   */
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

  /**
   * Cập nhật danh mục.
   * - Nếu cập nhật parentId, kiểm tra parentId mới có tồn tại không.
   * 
   * @param {string} id - ID danh mục cần cập nhật.
   * @param {UpdateCategoryDto} updateCategoryDto - Các trường cần cập nhật.
   * @returns {Promise<Category>}
   * 
   * @example
   * const updated = await categoriesService.update("catId", { name: "Tên mới" });
   */
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

  /**
   * Xóa danh mục.
   * 
   * @param {string} id - ID danh mục.
   * @returns {Promise<Category>} - Danh mục đã xóa.
   * 
   * @example
   * const deleted = await categoriesService.remove("catId");
   */
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

  /**
   * Tìm tất cả danh mục con của một danh mục cha.
   * 
   * @param {string} parentId - ID danh mục cha.
   * @returns {Promise<Category[]>} - Mảng các danh mục con.
   * 
   * @example
   * const children = await categoriesService.findChildren("parentCatId");
   * // => [{ name: "Ghế sofa", ... }, { name: "Ghế ăn", ... }]
   */
  async findChildren(parentId: string): Promise<Category[]> {
    return this.categoryModel.find({ parentId }).exec();
  }

  /**
   * Tìm tất cả danh mục gốc (không có danh mục cha - ParentID = null).
   * 
   * @returns {Promise<Category[]>} - Mảng các danh mục gốc.
   * 
   * @example
   * const roots = await categoriesService.findRootCategories();
   * // => [{ name: "Nội thất", parentId: null }, { name: "Ngoại thất", parentId: null }]
   */
  async findRootCategories(): Promise<Category[]> {
    return this.categoryModel.find({ parentId: null }).exec();
  }

  /**
   * Lấy cấu trúc cây danh mục (GroupBy Parent).
   * - Dùng cho menu frontend (Mega Menu).
   * - Format: { title: "Parent Name", items: [{ name: "Child Name", _id: "..." }] }
   * 
   * @returns {Promise<Array<{title: string, _id: string, items: Array<{name: string, _id: string}>}>>}
   * 
   * @example
   * const tree = await categoriesService.getAllCategoriesGroupByParentId();
   * // => [
   * //   { title: "Nội thất", _id: "...", items: [{ name: "Ghế", _id: "..." }, ...] },
   * //   { title: "Ngoại thất", _id: "...", items: [...] }
   * // ]
   */
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
          .find({ parentId: Types.ObjectId.createFromHexString(rootCategory._id.toString()) })
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

  /**
   * Lấy danh sách danh mục cha (Parent Categories).
   * 
   * @returns {Promise<Category[]>}
   * 
   * @example
   * const parents = await categoriesService.getCategoryParent();
   */
  async getCategoryParent(): Promise<Category[]> {
    const category = await this.categoryModel.find({ parentId: null }).exec();
    return category;
  }

  /**
   * Lấy danh sách danh mục con (Sub Categories).
   * 
   * @returns {Promise<Category[]>}
   * 
   * @example
   * const subs = await categoriesService.getCategorySub();
   */
  async getCategorySub(): Promise<Category[]> {
    const category = await this.categoryModel.find({ parentId: { $ne: null } }).exec();
    return category;
  }
}

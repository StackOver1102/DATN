import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner, BannerDocument, BannerPosition } from './entities/banner.entity';
import { FilterService } from 'src/common/services/filter.service';
import { FilterDto } from 'src/common/dto/filter.dto';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
    private readonly filterService: FilterService,
    private readonly uploadService: UploadService,
  ) { }

  /**
   * Tạo banner mới từ DTO.
   * 
   * @param {CreateBannerDto} createBannerDto - Thông tin banner.
   * @param {string} createBannerDto.title - Tiêu đề banner.
   * @param {string} createBannerDto.imageUrl - URL ảnh banner.
   * @param {BannerPosition} [createBannerDto.position] - Vị trí hiển thị (HOME, SIDEBAR, etc.).
   * @param {string} [createBannerDto.link] - Link khi click vào banner.
   * @param {boolean} [createBannerDto.isActive] - Trạng thái hoạt động.
   * @returns {Promise<Banner>} - Banner đã tạo.
   * @throws {BadRequestException} - Nếu tạo thất bại.
   * 
   * @example
   * const banner = await bannerService.create({
   *   title: "Summer Sale",
   *   imageUrl: "https://example.com/banner.jpg",
   *   position: BannerPosition.HOME,
   *   link: "/products"
   * });
   */
  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    try {
      const createdBanner = new this.bannerModel(createBannerDto);
      return await createdBanner.save();
    } catch (error) {
      throw new BadRequestException(
        `Failed to create banner: ${error.message}`,
      );
    }
  }

  /**
   * Tạo banner với upload ảnh trực tiếp từ client.
   * - Xử lý upload ảnh lên R2.
   * - Nếu tạo banner thất bại, tự động xóa ảnh đã upload (rollback).
   * 
   * @param {CreateBannerDto} createBannerDto - Thông tin banner.
   * @param {Object} file - Object chứa thông tin file upload.
   * @param {string} [file.imageUrl] - URL ảnh (nếu có).
   * @param {string} [file.location] - Location trả về từ S3/R2.
   * @param {string} [file.filename] - Tên file.
   * @param {string} [file.key] - Key trên R2 storage.
   * @returns {Promise<Banner>} - Banner đã tạo.
   * @throws {BadRequestException} - Nếu không có file hoặc tạo thất bại.
   * 
   * @example
   * // Đầu vào:
   * const dto = { title: "New Banner", position: "HOME" };
   * const file = { key: "banners/123-uuid.jpg" };
   * 
   * // Gọi hàm:
   * const banner = await bannerService.createBannerWithImageUpload(dto, file);
   */
  async createBannerWithImageUpload(
    createBannerDto: CreateBannerDto,
    file: {
      imageUrl?: string;
      location?: string;
      filename?: string;
      key?: string;
    },
  ): Promise<Banner> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Ưu tiên sử dụng URL từ Cloudflare R2
    const imageUrl = file.key
      ? this.uploadService.getFileUrl(file.key)
      : file.location || 'default.jpg';

    const bannerData = {
      ...createBannerDto,
      imageUrl: imageUrl,
    };

    try {
      // Tạo banner với imageUrl từ file upload
      const createdBanner = new this.bannerModel(bannerData);
      return await createdBanner.save();
    } catch (error) {
      // Nếu có lỗi và có file key, xóa file đã upload
      if (file.key) {
        try {
          await this.uploadService.deleteFile(file.key);
        } catch (deleteError) {
          console.error(
            `Failed to delete uploaded file: ${file.key}`,
            deleteError,
          );
        }
      }
      throw new BadRequestException(
        `Failed to create banner: ${error.message}`,
      );
    }
  }

  /**
   * Lấy tất cả banner (Admin).
   * 
   * @returns {Promise<Banner[]>} - Mảng tất cả banner, sắp xếp theo ngày tạo giảm dần.
   * 
   * @example
   * const allBanners = await bannerService.findAll();
   */
  async findAll(): Promise<Banner[]> {
    return await this.bannerModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Lấy banner có filter và phân trang.
   * 
   * @param {FilterDto} filterDto - Tham số filter và phân trang.
   * @param {number} filterDto.page - Trang hiện tại.
   * @param {number} filterDto.limit - Số lượng mỗi trang.
   * @returns {Promise<PaginatedResult<Banner>>} - Kết quả phân trang.
   * 
   * @example
   * const result = await bannerService.findAllWithFilters({ page: 1, limit: 10 });
   */
  async findAllWithFilters(filterDto: FilterDto): Promise<PaginatedResult<Banner>> {
    return await this.filterService.applyFilters(this.bannerModel, filterDto);
  }

  /**
   * Lấy banner theo vị trí hiển thị (chỉ lấy banner đang active).
   * 
   * @param {BannerPosition} position - Vị trí (HOME, SIDEBAR, FOOTER, etc.).
   * @returns {Promise<Banner[]>} - Mảng banner tại vị trí đó.
   * 
   * @example
   * const homeBanners = await bannerService.findByPosition(BannerPosition.HOME);
   */
  async findByPosition(position: BannerPosition): Promise<Banner[]> {
    return await this.bannerModel
      .find({ position, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy tất cả banner đang active (Public).
   * 
   * @returns {Promise<Banner[]>}
   * 
   * @example
   * const activeBanners = await bannerService.findActive();
   */
  async findActive(): Promise<Banner[]> {
    return await this.bannerModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết một banner.
   * 
   * @param {string} id - ID banner (MongoDB ObjectId).
   * @returns {Promise<Banner>}
   * @throws {BadRequestException} - Nếu ID không hợp lệ.
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * const banner = await bannerService.findOne("507f1f77bcf86cd799439011");
   */
  async findOne(id: string): Promise<Banner> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid banner ID format');
    }

    const banner = await this.bannerModel.findById(id).exec();
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
    return banner;
  }

  /**
   * Cập nhật banner.
   * 
   * @param {string} id - ID banner.
   * @param {UpdateBannerDto} updateBannerDto - Các trường cần cập nhật.
   * @returns {Promise<Banner>} - Banner đã cập nhật.
   * 
   * @example
   * const updated = await bannerService.update("bannerId", { title: "New Title" });
   */
  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<Banner> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid banner ID format');
    }

    const updatedBanner = await this.bannerModel
      .findByIdAndUpdate(id, updateBannerDto, { new: true })
      .exec();

    if (!updatedBanner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    return updatedBanner;
  }

  /**
   * Bật/tắt trạng thái hoạt động của banner (Toggle).
   * 
   * @param {string} id - ID banner.
   * @returns {Promise<Banner>} - Banner với trạng thái mới.
   * 
   * @example
   * // Banner đang active -> inactive
   * // Banner đang inactive -> active
   * const toggled = await bannerService.toggleStatus("bannerId");
   */
  async toggleStatus(id: string): Promise<Banner> {
    const banner = await this.findOne(id);

    return await this.update(id, { isActive: !banner.isActive ? 'true' : 'false' });
  }

  /**
   * Xóa banner.
   * 
   * @param {string} id - ID banner.
   * @returns {Promise<void>}
   * @throws {BadRequestException} - Nếu ID không hợp lệ.
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * await bannerService.remove("bannerId");
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid banner ID format');
    }

    const deletedBanner = await this.bannerModel.findByIdAndDelete(id).exec();
    if (!deletedBanner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
  }
}

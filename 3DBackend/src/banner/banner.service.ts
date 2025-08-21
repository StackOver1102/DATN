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
  ) {}

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

  async findAll(): Promise<Banner[]> {
    return await this.bannerModel.find().sort({ createdAt: -1 }).exec();
  }

  async findAllWithFilters(filterDto: FilterDto): Promise<PaginatedResult<Banner>> {
    return await this.filterService.applyFilters(this.bannerModel, filterDto);
  }

  async findByPosition(position: BannerPosition): Promise<Banner[]> {
    return await this.bannerModel
      .find({ position, isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActive(): Promise<Banner[]> {
    return await this.bannerModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

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

  async toggleStatus(id: string): Promise<Banner> {
    const banner = await this.findOne(id);
    
    return await this.update(id, { isActive: !banner.isActive ? 'true' : 'false' });
  }

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

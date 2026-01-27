import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MasterData, MasterDataDocument } from './entities/master-data.entity';
import { CreateMasterDataDto } from './dto/create-master-data.dto';
import { UpdateMasterDataDto } from './dto/update-master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectModel(MasterData.name)
    private masterDataModel: Model<MasterDataDocument>,
  ) { }

  /**
   * Tạo mới master data.
   * Master data dùng để lưu các dữ liệu tĩnh như: colors, materials, styles, categories, etc.
   * 
   * @param {CreateMasterDataDto} createMasterDataDto - Thông tin master data.
   * @param {string} createMasterDataDto.type - Loại dữ liệu (e.g., 'color', 'material', 'style').
   * @param {string} createMasterDataDto.code - Mã code định danh.
   * @param {string} createMasterDataDto.name - Tên hiển thị.
   * @param {number} [createMasterDataDto.order] - Thứ tự sắp xếp.
   * @param {boolean} [createMasterDataDto.isActive] - Trạng thái hoạt động.
   * @returns {Promise<MasterData>} - Master data đã tạo.
   * 
   * @example
   * const data = await masterDataService.create({
   *   type: "color",
   *   code: "RED",
   *   name: "Đỏ",
   *   order: 1,
   *   isActive: true
   * });
   */
  async create(createMasterDataDto: CreateMasterDataDto): Promise<MasterData> {
    const createdMasterData = new this.masterDataModel(createMasterDataDto);
    return createdMasterData.save();
  }

  /**
   * Lấy tất cả master data (Admin).
   * 
   * @returns {Promise<MasterData[]>} - Mảng tất cả master data.
   * 
   * @example
   * const allData = await masterDataService.findAll();
   */
  async findAll(): Promise<MasterData[]> {
    return this.masterDataModel.find().exec();
  }

  /**
   * Lấy master data theo loại (type).
   * - Chỉ lấy các bản ghi đang active.
   * - Sắp xếp theo thứ tự (order) tăng dần.
   * 
   * @param {string} type - Loại master data (e.g., 'color', 'material', 'style').
   * @returns {Promise<MasterData[]>} - Mảng master data theo type.
   * 
   * @example
   * const colors = await masterDataService.findByType("color");
   * // => [{ code: "RED", name: "Đỏ" }, { code: "BLUE", name: "Xanh" }]
   */
  async findByType(type: string): Promise<MasterData[]> {
    return this.masterDataModel
      .find({ type, isActive: true })
      .sort({ order: 1 })
      .exec();
  }

  /**
   * Lấy chi tiết một master data.
   * 
   * @param {string} id - ID master data (MongoDB ObjectId).
   * @returns {Promise<MasterData>}
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * const data = await masterDataService.findOne("507f1f77bcf86cd799439011");
   */
  async findOne(id: string): Promise<MasterData> {
    const masterData = await this.masterDataModel.findById(id).exec();
    if (!masterData) {
      throw new NotFoundException(`Master data with ID ${id} not found`);
    }
    return masterData;
  }

  /**
   * Cập nhật master data.
   * 
   * @param {string} id - ID master data.
   * @param {UpdateMasterDataDto} updateMasterDataDto - Các trường cần cập nhật.
   * @returns {Promise<MasterData>}
   * 
   * @example
   * const updated = await masterDataService.update("id", { name: "Tên mới" });
   */
  async update(
    id: string,
    updateMasterDataDto: UpdateMasterDataDto,
  ): Promise<MasterData> {
    const updatedMasterData = await this.masterDataModel
      .findByIdAndUpdate(id, updateMasterDataDto, { new: true })
      .exec();

    if (!updatedMasterData) {
      throw new NotFoundException(`Master data with ID ${id} not found`);
    }

    return updatedMasterData;
  }

  /**
   * Xóa master data.
   * 
   * @param {string} id - ID master data.
   * @returns {Promise<MasterData>} - Master data đã xóa.
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * await masterDataService.remove("id");
   */
  async remove(id: string): Promise<MasterData> {
    const deletedMasterData = await this.masterDataModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedMasterData) {
      throw new NotFoundException(`Master data with ID ${id} not found`);
    }

    return deletedMasterData;
  }

  /**
   * Tìm master data theo type và code.
   * - Dùng để tra cứu nhanh một giá trị cụ thể.
   * 
   * @param {string} type - Loại master data.
   * @param {string} code - Mã code.
   * @returns {Promise<MasterData>}
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * const red = await masterDataService.findByTypeAndCode("color", "RED");
   * // => { type: "color", code: "RED", name: "Đỏ", ... }
   */
  async findByTypeAndCode(type: string, code: string): Promise<MasterData> {
    const masterData = await this.masterDataModel
      .findOne({ type, code })
      .exec();
    if (!masterData) {
      throw new NotFoundException(
        `Master data with type ${type} and code ${code} not found`,
      );
    }
    return masterData;
  }
}

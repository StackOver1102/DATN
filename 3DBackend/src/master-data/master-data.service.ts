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
  ) {}

  async create(createMasterDataDto: CreateMasterDataDto): Promise<MasterData> {
    const createdMasterData = new this.masterDataModel(createMasterDataDto);
    return createdMasterData.save();
  }

  async findAll(): Promise<MasterData[]> {
    // const {
    //   limit = 10,
    //   page = 1,
    //   sortBy = 'createdAt',
    //   ...filters
    // } = filterDto;

    // const query: any = {};

    // if (filters.type) {
    //   query.type = filters.type;
    // }

    // if (filters.code) {
    //   query.code = { $regex: filters.code, $options: 'i' };
    // }

    // if (filters.name) {
    //   query.name = { $regex: filters.name, $options: 'i' };
    // }

    // if (filters.isActive !== undefined) {
    //   query.isActive = filters.isActive;
    // }

    // const skip = (page - 1) * limit;
    // const count = await this.masterDataModel.countDocuments(query);

    // const data = await this.masterDataModel
    //   .find(query)
    //   .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    //   .skip(skip)
    //   .limit(limit)
    //   .exec();

    return this.masterDataModel.find().exec();
  }

  async findByType(type: string): Promise<MasterData[]> {
    return this.masterDataModel
      .find({ type, isActive: true })
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<MasterData> {
    const masterData = await this.masterDataModel.findById(id).exec();
    if (!masterData) {
      throw new NotFoundException(`Master data with ID ${id} not found`);
    }
    return masterData;
  }

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

  async remove(id: string): Promise<MasterData> {
    const deletedMasterData = await this.masterDataModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedMasterData) {
      throw new NotFoundException(`Master data with ID ${id} not found`);
    }

    return deletedMasterData;
  }

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

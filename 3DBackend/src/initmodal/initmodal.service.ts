import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateInitmodalDto } from './dto/create-initmodal.dto';
import { UpdateInitmodalDto } from './dto/update-initmodal.dto';
import { Initmodal, InitmodalDocument } from './entities/initmodal.entity';

@Injectable()
export class InitmodalService {
  constructor(
    @InjectModel(Initmodal.name) private initmodalModel: Model<InitmodalDocument>,
  ) {}

  async create(createInitmodalDto: CreateInitmodalDto): Promise<Initmodal> {
    try {
      const createdInitmodal = new this.initmodalModel(createInitmodalDto);
      return await createdInitmodal.save();
    } catch (error) {
      throw new BadRequestException(
        `Failed to create initmodal: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Initmodal[]> {
    return await this.initmodalModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Initmodal> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid initmodal ID format');
    }

    const initmodal = await this.initmodalModel.findById(id).exec();
    if (!initmodal) {
      throw new NotFoundException(`Initmodal with ID ${id} not found`);
    }
    return initmodal;
  }

  async update(id: string, updateInitmodalDto: UpdateInitmodalDto): Promise<Initmodal> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid initmodal ID format');
    }

    const updatedInitmodal = await this.initmodalModel
      .findByIdAndUpdate(id, updateInitmodalDto, { new: true })
      .exec();

    if (!updatedInitmodal) {
      throw new NotFoundException(`Initmodal with ID ${id} not found`);
    }

    return updatedInitmodal;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid initmodal ID format');
    }

    const deletedInitmodal = await this.initmodalModel.findByIdAndDelete(id).exec();
    if (!deletedInitmodal) {
      throw new NotFoundException(`Initmodal with ID ${id} not found`);
    }
  }

  async getInitmodal(): Promise<Initmodal> {
    const initmodal = await this.initmodalModel.findOne({ isActive: true }).exec();
    if (!initmodal) {
      throw new NotFoundException(`Initmodal not found`);
    }
    return initmodal;
  }
}

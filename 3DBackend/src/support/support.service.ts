import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSupportDto } from './dto/create-support.dto';
import {
  RespondToSupportDto,
  UpdateSupportDto,
} from './dto/update-support.dto';
import {
  SupportRequest,
  SupportRequestDocument,
  SupportStatus,
} from './entities/support.entity';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportRequest.name)
    private supportRequestModel: Model<SupportRequestDocument>,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  async create(
    createSupportDto: CreateSupportDto,
    userId?: string,
  ): Promise<SupportRequest> {
    const supportRequest = new this.supportRequestModel({
      ...createSupportDto,
      status: SupportStatus.PENDING,
      ...(userId && { userId: new Types.ObjectId(userId) }),
    });

    const savedRequest = await supportRequest.save();

    // Send confirmation email
    try {
      await this.mailService.sendSupportRequestConfirmation(savedRequest);
    } catch (error) {
      console.error(
        'Failed to send support request confirmation email:',
        error,
      );
    }

    return savedRequest;
  }

  async findAll(): Promise<SupportRequest[]> {
    return this.supportRequestModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByStatus(status: SupportStatus): Promise<SupportRequest[]> {
    return this.supportRequestModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string): Promise<SupportRequest[]> {
    return this.supportRequestModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<SupportRequestDocument> {
    const supportRequest = await this.supportRequestModel.findById(id).exec();

    if (!supportRequest) {
      throw new NotFoundException(`Không tìm thấy yêu cầu hỗ trợ với ID ${id}`);
    }

    return supportRequest;
  }

  async update(
    id: string,
    updateSupportDto: UpdateSupportDto,
    updatedBy: string,
  ): Promise<SupportRequest> {
    const updatedSupportRequest = await this.supportRequestModel
      .findByIdAndUpdate(
        id,
        { ...updateSupportDto, respondedBy: new Types.ObjectId(updatedBy) },
        { new: true },
      )
      .exec();

    if (!updatedSupportRequest) {
      throw new NotFoundException(`Không tìm thấy yêu cầu hỗ trợ với ID ${id}`);
    }

    return updatedSupportRequest;
  }

  async respond(
    id: string,
    respondToSupportDto: RespondToSupportDto,
    adminId: string,
  ): Promise<SupportRequest> {
    // Verify admin exists
    await this.usersService.findOne(adminId);

    const supportRequest = await this.findOne(id);

    if (
      supportRequest.status === SupportStatus.RESOLVED ||
      supportRequest.status === SupportStatus.CLOSED
    ) {
      throw new BadRequestException('Yêu cầu hỗ trợ này đã được xử lý');
    }

    const updatedSupportRequest = await this.supportRequestModel
      .findByIdAndUpdate(
        id,
        {
          response: respondToSupportDto.response,
          status: respondToSupportDto.status || SupportStatus.RESOLVED,
          respondedBy: new Types.ObjectId(adminId),
          respondedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!updatedSupportRequest) {
      throw new NotFoundException(`Không tìm thấy yêu cầu hỗ trợ với ID ${id}`);
    }

    // Send response email
    try {
      await this.mailService.sendSupportResponse(updatedSupportRequest);
    } catch (error) {
      console.error('Failed to send support response email:', error);
    }

    return updatedSupportRequest;
  }

  async remove(id: string): Promise<SupportRequest> {
    const deletedSupportRequest = await this.supportRequestModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedSupportRequest) {
      throw new NotFoundException(`Không tìm thấy yêu cầu hỗ trợ với ID ${id}`);
    }

    return deletedSupportRequest;
  }
}

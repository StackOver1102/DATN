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
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/types/notification';
import { FilterDto } from 'src/common/dto/filter.dto';
import { FilterService } from 'src/common/services/filter.service';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportRequest.name)
    private supportRequestModel: Model<SupportRequestDocument>,
    private usersService: UsersService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
    private filterService: FilterService,
  ) { }

  async create(
    createSupportDto: CreateSupportDto,
    userId?: string,
  ): Promise<SupportRequestDocument> {
    const supportRequest = new this.supportRequestModel({
      ...createSupportDto,
      status: SupportStatus.PENDING,
      ...(userId && { userId: new Types.ObjectId(userId) }),
    });

    const savedRequest = await supportRequest.save();

    // Create notification for admin
    try {
      await this.notificationsService.create({
        message: `New support request: ${createSupportDto.name}`,
        originalId: savedRequest._id.toString(),
        originType: NotificationType.SUPPORT,
        userId: userId ? new Types.ObjectId(userId) : undefined,
        // originType: NotificationType.SUPPORT 
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

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

  async findByUserId(userId: string, filterDto: FilterDto): Promise<PaginatedResult<SupportRequestDocument>> {
    // const baseQuery = { userId };

    // return this.filterService.applyFilters<SupportRequestDocument>(
    //   this.supportRequestModel, 
    //   filterDto, 
    //   baseQuery, 
    //   [
    //     'name',
    //     'message',
    //     'email',
    //   ]
    // );
    const { page, limit } = filterDto;
    if (!page || !limit) {
      throw new BadRequestException('Page and limit are required');
    }
    const skip = (page - 1) * limit;
    const total = await this.supportRequestModel.countDocuments({ userId: new Types.ObjectId(userId) });
    const supportRequests = await this.supportRequestModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
    return {
      items: supportRequests,
      meta: {
        totalItems: total,
        itemCount: supportRequests.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
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

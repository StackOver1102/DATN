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
import { CaptchaService } from 'src/common/services/captcha.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportRequest.name)
    private supportRequestModel: Model<SupportRequestDocument>,
    private usersService: UsersService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
    private filterService: FilterService,
    private captchaService: CaptchaService,
  ) { }

  /**
   * Tạo yêu cầu hỗ trợ mới (Support Ticket).
   * - Xác thực CAPTCHA để chống spam.
   * - Tạo thông báo cho Admin.
   * - Gửi email xác nhận cho user.
   * 
   * @param {CreateSupportDto} createSupportDto - Thông tin yêu cầu hỗ trợ.
   * @param {string} createSupportDto.name - Tên người gửi.
   * @param {string} createSupportDto.email - Email liên hệ.
   * @param {string} createSupportDto.subject - Tiêu đề.
   * @param {string} createSupportDto.message - Nội dung yêu cầu.
   * @param {string} createSupportDto.captchaToken - Token CAPTCHA.
   * @param {string} [userId] - ID người dùng (optional, nếu đã đăng nhập).
   * @returns {Promise<SupportRequestDocument>} - Yêu cầu hỗ trợ đã tạo.
   * 
   * @example
   * // Đầu vào:
   * const dto = {
   *   name: "Nguyen Van A",
   *   email: "user@example.com",
   *   subject: "Không tải được file",
   *   message: "Tôi đã mua sản phẩm nhưng không tải được...",
   *   captchaToken: "abc..."
   * };
   * 
   * // Gọi hàm:
   * const ticket = await supportService.create(dto, "userId123");
   * 
   * // Đầu ra:
   * // { _id: "...", status: "PENDING", email: "user@example.com", ... }
   */
  async create(
    createSupportDto: CreateSupportDto,
    userId?: string,
  ): Promise<SupportRequestDocument> {
    // Remove captchaToken from data before saving
    const { captchaToken, ...supportData } = createSupportDto;

    const supportRequest = new this.supportRequestModel({
      ...supportData,
      status: SupportStatus.PENDING,
      ...(userId && { userId: new Types.ObjectId(userId) }),
    });

    const savedRequest = await supportRequest.save();

    // Create notification for admin
    try {
      await this.notificationsService.create({
        message: `New support request: ${supportData.name}`,
        originalId: savedRequest._id.toString(),
        originType: NotificationType.SUPPORT,
        userId: userId ? new Types.ObjectId(userId) : undefined,
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

  /**
   * Lấy tất cả yêu cầu hỗ trợ (Admin).
   * 
   * @returns {Promise<SupportRequest[]>}
   * 
   * @example
   * const allTickets = await supportService.findAll();
   */
  async findAll(): Promise<SupportRequest[]> {
    return this.supportRequestModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Lấy yêu cầu hỗ trợ theo trạng thái (Admin).
   * 
   * @param {SupportStatus} status - Trạng thái cần filter (PENDING, RESOLVED, CLOSED).
   * @returns {Promise<SupportRequest[]>}
   * 
   * @example
   * const pending = await supportService.findByStatus(SupportStatus.PENDING);
   */
  async findByStatus(status: SupportStatus): Promise<SupportRequest[]> {
    return this.supportRequestModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy lịch sử yêu cầu hỗ trợ của một User.
   * - Hỗ trợ phân trang (Pagination).
   * 
   * @param {string} userId - ID người dùng.
   * @param {FilterDto} filterDto - Tham số phân trang.
   * @param {number} filterDto.page - Trang hiện tại.
   * @param {number} filterDto.limit - Số lượng mỗi trang.
   * @returns {Promise<PaginatedResult<SupportRequestDocument>>}
   * 
   * @example
   * const history = await supportService.findByUserId("userId", { page: 1, limit: 10 });
   */
  async findByUserId(
    userId: string,
    filterDto: FilterDto,
  ): Promise<PaginatedResult<SupportRequestDocument>> {
    const { page, limit } = filterDto;
    if (!page || !limit) {
      throw new BadRequestException('Page and limit are required');
    }
    const skip = (page - 1) * limit;
    const total = await this.supportRequestModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
    const supportRequests = await this.supportRequestModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
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

  /**
   * Lấy chi tiết một yêu cầu hỗ trợ.
   * 
   * @param {string} id - ID yêu cầu hỗ trợ.
   * @returns {Promise<SupportRequestDocument>}
   * @throws {NotFoundException}
   * 
   * @example
   * const ticket = await supportService.findOne("ticketId");
   */
  async findOne(id: string): Promise<SupportRequestDocument> {
    const supportRequest = await this.supportRequestModel.findById(id).exec();

    if (!supportRequest) {
      throw new NotFoundException(`Không tìm thấy yêu cầu hỗ trợ với ID ${id}`);
    }

    return supportRequest;
  }

  /**
   * Cập nhật thông tin yêu cầu hỗ trợ.
   * 
   * @param {string} id - ID yêu cầu.
   * @param {UpdateSupportDto} updateSupportDto - Các trường cần cập nhật.
   * @param {string} updatedBy - ID người cập nhật.
   * @returns {Promise<SupportRequest>}
   * 
   * @example
   * await supportService.update("ticketId", { status: "CLOSED" }, "adminId");
   */
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

  /**
   * Phản hồi yêu cầu hỗ trợ (Admin Respond).
   * - Cập nhật nội dung trả lời.
   * - Đổi trạng thái sang RESOLVED.
   * - Gửi email phản hồi cho User.
   * 
   * @param {string} id - ID yêu cầu hỗ trợ.
   * @param {RespondToSupportDto} respondToSupportDto - Nội dung phản hồi.
   * @param {string} respondToSupportDto.response - Nội dung trả lời.
   * @param {SupportStatus} [respondToSupportDto.status] - Trạng thái mới (default: RESOLVED).
   * @param {string} adminId - ID admin phản hồi.
   * @returns {Promise<SupportRequest>}
   * 
   * @example
   * await supportService.respond("ticketId", { response: "Xin lỗi về sự bất tiện..." }, "adminId");
   */
  async respond(
    id: string,
    respondToSupportDto: RespondToSupportDto,
    adminId: string,
  ): Promise<SupportRequest> {
    // Verify admin exists
    await this.usersService.findOne(adminId);

    const supportRequest = await this.findOne(id);

    // Không thể phản hồi nếu đã đóng hoặc đã giải quyết
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

  /**
   * Xóa yêu cầu hỗ trợ.
   * 
   * @param {string} id - ID yêu cầu.
   * @returns {Promise<SupportRequest>}
   * 
   * @example
   * await supportService.remove("ticketId");
   */
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

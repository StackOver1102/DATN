import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { Refund, RefundDocument, RefundStatus } from './entities/refund.entity';
import { OrdersService } from 'src/orders/orders.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { OrderStatus } from 'src/orders/entities/order.entity';
import { TransactionStatus, TransactionType } from 'src/enum/transactions.enum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/types/notification';
import { FilterDto } from 'src/common/dto/filter.dto';
import { FilterService } from 'src/common/services/filter.service';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';

@Injectable()
export class RefundService {
  constructor(
    @InjectModel(Refund.name) private refundModel: Model<RefundDocument>,
    private ordersService: OrdersService,
    private transactionsService: TransactionsService,
    private notificationsService: NotificationsService,
    private filterService: FilterService,
  ) { }

  /**
   * Tạo yêu cầu hoàn tiền cho đơn hàng.
   * - Kiểm tra đơn hàng có tồn tại và thuộc về user không.
   * - Kiểm tra trạng thái đơn hàng (chưa hoàn tiền, chưa hủy).
   * - Đảm bảo chưa có yêu cầu hoàn tiền nào đang pending.
   * 
   * @param {CreateRefundDto} createRefundDto - Thông tin yêu cầu hoàn tiền.
   * @param {string} createRefundDto.orderId - ID đơn hàng cần hoàn tiền.
   * @param {string} [createRefundDto.reason] - Lý do yêu cầu hoàn tiền.
   * @param {string} userId - ID người dùng tạo yêu cầu.
   * @returns {Promise<RefundDocument>} - Yêu cầu hoàn tiền đã tạo.
   * @throws {NotFoundException} - Nếu đơn hàng không tồn tại.
   * @throws {BadRequestException} - Nếu không đủ điều kiện hoàn tiền.
   * 
   * @example
   * // Đầu vào:
   * const dto = { orderId: "orderId123", reason: "Sản phẩm lỗi" };
   * 
   * // Gọi hàm:
   * const refund = await refundService.create(dto, "userId");
   * 
   * // Đầu ra:
   * // { _id: "...", orderId: "...", userId: "...", status: "PENDING", amount: 100000 }
   */
  async create(
    createRefundDto: CreateRefundDto,
    userId: string,
  ): Promise<RefundDocument> {
    // Check if order exists and belongs to the user
    const order = await this.ordersService.findOne(createRefundDto.orderId);

    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy đơn hàng với ID ${createRefundDto.orderId}`,
      );
    }

    if (order.userId._id.toString() !== userId) {
      throw new BadRequestException(
        'Bạn chỉ có thể yêu cầu hoàn tiền cho đơn hàng của mình',
      );
    }

    // Check if order is eligible for refund (not already refunded or cancelled)
    if (order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('Đơn hàng này đã được hoàn tiền');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng đã hủy không thể hoàn tiền');
    }

    const existingRefund = await this.refundModel.findOne({
      orderId: new Types.ObjectId(createRefundDto.orderId),
      status: RefundStatus.PENDING,
    });
    if (existingRefund) {
      throw new BadRequestException('Đơn hàng này đã có yêu cầu hoàn tiền');
    }

    // Create the refund request
    const refund = new this.refundModel({
      ...createRefundDto,
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(createRefundDto.orderId),
      amount: order.totalAmount, // Hoàn lại toàn bộ số tiền
    });

    const savedRefund: RefundDocument = await refund.save();

    // Thông báo cho hệ thống
    if (savedRefund) {
      await this.notificationsService.create({
        message: `New refund request from ${NotificationType.REFUND}`,
        originalId: savedRefund._id.toString(),
        originType: NotificationType.REFUND,
        userId: new Types.ObjectId(userId),
      });
    }

    return savedRefund;
  }

  /**
   * Lấy tất cả yêu cầu hoàn tiền (Admin).
   * - Populate thông tin User, Order, Product để hiển thị đầy đủ.
   * 
   * @returns {Promise<Refund[]>}
   * 
   * @example
   * const allRefunds = await refundService.findAll();
   */
  async findAll(): Promise<Refund[]> {
    return this.refundModel
      .find()
      .populate('userId', '-password')
      .populate({
        path: 'orderId',
        model: 'Order',
        populate: {
          path: 'productId',
          model: 'Product',
          select: 'name images price',
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy danh sách yêu cầu hoàn tiền của User.
   * 
   * @param {string} userId - ID người dùng.
   * @param {FilterDto} filterDto - Tham số phân trang.
   * @returns {Promise<PaginatedResult<RefundDocument>>}
   * 
   * @example
   * const myRefunds = await refundService.findByUserId("userId", { page: 1, limit: 10 });
   */
  async findByUserId(
    userId: string,
    filterDto: FilterDto,
  ): Promise<PaginatedResult<RefundDocument>> {
    const result = await this.filterService.applyFilters<RefundDocument>(
      this.refundModel,
      filterDto,
      { userId: new Types.ObjectId(userId) },
      [
        'name',
        'description',
        'categoryName',
        'categoryPath',
        'style',
        'materials',
        'render',
        'form',
        'color',
        'isPro',
      ],
    );

    // Populate product information for each refund
    await Promise.all(
      result.items.map(async (refund) => {
        await refund.populate({
          path: 'orderId',
          model: 'Order',
          populate: {
            path: 'productId',
            model: 'Product',
            select: 'name images price',
          },
        });
      }),
    );

    return result;
  }

  /**
   * Lấy chi tiết một yêu cầu hoàn tiền.
   * 
   * @param {string} id - ID yêu cầu hoàn tiền.
   * @returns {Promise<RefundDocument>}
   * @throws {NotFoundException}
   * 
   * @example
   * const refund = await refundService.findOne("refundId");
   */
  async findOne(id: string): Promise<RefundDocument> {
    const refund = await this.refundModel
      .findById(id)
      .populate('userId', '-password')
      .populate({
        path: 'orderId',
        model: 'Order',
        populate: {
          path: 'productId',
          model: 'Product',
          select: 'name images price',
        },
      })
      .exec();

    if (!refund) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu hoàn tiền với ID ${id}`,
      );
    }

    return refund;
  }

  /**
   * Cập nhật trạng thái yêu cầu hoàn tiền (Admin).
   * - Nếu duyệt (APPROVED): Thực hiện hoàn tiền (cộng tiền ví).
   * - Nếu hoàn tất (COMPLETED): Cập nhật trạng thái đơn hàng thành REFUNDED.
   * 
   * @param {string} id - ID yêu cầu hoàn tiền.
   * @param {UpdateRefundDto} updateRefundDto - Các trường cần cập nhật.
   * @param {RefundStatus} updateRefundDto.status - Trạng thái mới (APPROVED, REJECTED, COMPLETED).
   * @returns {Promise<Refund>}
   * 
   * @example
   * // Duyệt yêu cầu (tiền sẽ được cộng vào ví user):
   * await refundService.update("refundId", { status: RefundStatus.APPROVED });
   * 
   * // Hoàn tất (đơn hàng sẽ chuyển sang REFUNDED):
   * await refundService.update("refundId", { status: RefundStatus.COMPLETED });
   */
  async update(id: string, updateRefundDto: UpdateRefundDto): Promise<Refund> {
    const refund: RefundDocument | null = await this.refundModel
      .findById({ _id: new Types.ObjectId(id) })
      .exec();

    console.log(refund);
    // Nếu status được update sang APPROVED -> Xử lý hoàn tiền
    if (
      refund &&
      updateRefundDto.status === RefundStatus.APPROVED &&
      refund.status !== RefundStatus.APPROVED
    ) {
      await this.processRefund(refund);
    }

    // Nếu status được update sang COMPLETED -> Update đơn hàng
    if (
      refund &&
      updateRefundDto.status === RefundStatus.COMPLETED &&
      refund.status !== RefundStatus.COMPLETED
    ) {
      await this.ordersService.update(refund.orderId.toString(), {
        status: OrderStatus.REFUNDED,
      });
    }

    // Update the refund document
    const updatedRefund = await this.refundModel
      .findByIdAndUpdate(
        id,
        {
          ...updateRefundDto,
          ...(updateRefundDto.status && { processedAt: new Date() }),
        },
        { new: true },
      )
      .exec();

    if (!updatedRefund) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu hoàn tiền với ID ${id}`,
      );
    }

    return updatedRefund;
  }

  /**
   * Xử lý hoàn tiền vào ví người dùng (Logic nghiệp vụ).
   * - Tạo giao dịch loại REFUND, method WALLET, status SUCCESS.
   * - Tiền sẽ tự động được cộng vào balance user thông qua TransactionsService.
   * 
   * @param {RefundDocument} refund - Document yêu cầu hoàn tiền.
   * @returns {Promise<void>}
   * 
   * @example
   * // Được gọi nội bộ bởi update() khi status = APPROVED
   * await this.processRefund(refund);
   */
  async processRefund(refund: RefundDocument): Promise<void> {
    // Create refund transaction
    const transaction = await this.transactionsService.create(
      {
        amount: refund.amount,
        type: TransactionType.REFUND,
        description: `Hoàn tiền cho đơn hàng #${refund.orderId.toString()}`,
        orderId: refund.orderId,
        status: TransactionStatus.SUCCESS,
      },
      refund.userId.toString(),
    );

    // Update the refund with transaction ID
    await this.refundModel.findByIdAndUpdate(refund._id, {
      transactionId: transaction._id,
    });
  }

  /**
   * Xóa yêu cầu hoàn tiền (Chỉ cho phép khi đang PENDING).
   * 
   * @param {string} id - ID yêu cầu hoàn tiền.
   * @returns {Promise<Refund>}
   * @throws {BadRequestException} - Nếu yêu cầu không ở trạng thái PENDING.
   * 
   * @example
   * await refundService.remove("refundId");
   */
  async remove(id: string): Promise<Refund> {
    const refund = await this.findOne(id);

    // Only pending refunds can be deleted
    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể xóa yêu cầu hoàn tiền đang chờ xử lý',
      );
    }

    const deletedRefund = await this.refundModel.findByIdAndDelete(id).exec();

    if (!deletedRefund) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu hoàn tiền với ID ${id}`,
      );
    }

    return deletedRefund;
  }
}

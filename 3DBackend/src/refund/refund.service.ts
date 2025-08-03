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
import { TransactionType } from 'src/enum/transactions.enum';

@Injectable()
export class RefundService {
  constructor(
    @InjectModel(Refund.name) private refundModel: Model<RefundDocument>,
    private ordersService: OrdersService,
    private transactionsService: TransactionsService,
  ) {}

  async create(
    createRefundDto: CreateRefundDto,
    userId: string,
  ): Promise<Refund> {
    // Check if order exists and belongs to the user
    const order = await this.ordersService.findOne(createRefundDto.orderId);

    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy đơn hàng với ID ${createRefundDto.orderId}`,
      );
    }

    if (order.userId.toString() !== userId) {
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

    // Create the refund request
    const refund = new this.refundModel({
      ...createRefundDto,
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(createRefundDto.orderId),
      amount: order.totalAmount,
    });

    return refund.save();
  }

  async findAll(): Promise<Refund[]> {
    return this.refundModel.find().exec();
  }

  async findByUserId(userId: string): Promise<Refund[]> {
    return this.refundModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<RefundDocument> {
    const refund = await this.refundModel.findById(id).exec();

    if (!refund) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu hoàn tiền với ID ${id}`,
      );
    }

    return refund;
  }

  async update(id: string, updateRefundDto: UpdateRefundDto): Promise<Refund> {
    const refund = await this.findOne(id);

    // If status is being updated to APPROVED, process the refund
    if (
      updateRefundDto.status === RefundStatus.APPROVED &&
      refund.status !== RefundStatus.APPROVED
    ) {
      await this.processRefund(refund);
    }

    // If status is being updated to COMPLETED, mark the order as refunded
    if (
      updateRefundDto.status === RefundStatus.COMPLETED &&
      refund.status !== RefundStatus.COMPLETED
    ) {
      await this.ordersService.update(refund.orderId.toString(), {
        status: OrderStatus.REFUNDED,
      });
    }

    // Update the refund
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

  async processRefund(refund: RefundDocument): Promise<void> {
    // Create refund transaction
    const transaction = await this.transactionsService.create(
      {
        amount: refund.amount,
        type: TransactionType.REFUND,
        description: `Hoàn tiền cho đơn hàng #${refund.orderId.toString()}`,
        orderId: refund.orderId,
      },
      refund.userId.toString(),
    );

    // Update the refund with transaction ID
    await this.refundModel.findByIdAndUpdate(refund._id, {
      transactionId: transaction._id,
    });
  }

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

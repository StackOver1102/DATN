import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument, OrderStatus } from './entities/order.entity';
import { UsersService } from 'src/users/users.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TransactionStatus, TransactionType } from 'src/enum/transactions.enum';
import { ProductsService } from 'src/products/products.service';
import { GoogleDriveService } from 'src/drive/google-drive.service';
import { FilterDto } from 'src/common/dto/filter.dto';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { FilterService } from 'src/common/services/filter.service';
import { TransactionDocument } from 'src/transactions/entities/transaction.entity';
import { UserDocument } from 'src/users/types';
import { ProductDocument } from 'src/products/entities/product.entity';

interface OrderToRemoveGoogleDrive {
  productId: ProductDocument;
  userId: UserDocument;
  isRemoveGoogleDrive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _id: string;
}
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
    private productsService: ProductsService,
    private driveService: GoogleDriveService,
    private filterService: FilterService,

  ) { }

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<{ urlDownload: string }> {
    let transaction: TransactionDocument | null = null;
    let initialBalance = 0;
    try {
      const user = await this.usersService.findOne(userId);

      const { email } = user;

      const { balance } = user;
      initialBalance = balance; // Store initial balance for rollback
      const { productId } = createOrderDto;

      const product = await this.productsService.findById(productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const { discount, urlDownload, price } = product;
      const totalAmount = discount ? price - (price * discount) / 100 : price;

      if (balance < totalAmount) {
        throw new BadRequestException('Insufficient balance to complete payment');
      }

      const fileId = this.driveService.getIdByUrl(urlDownload!);
      if (!fileId) {
        throw new BadRequestException('File not found');
      }

      // Create transaction only after validating everything else
      transaction = await this.transactionsService.create(
        {
          amount: totalAmount,
          type: TransactionType.PAYMENT,
          balanceBefore: balance,
          balanceAfter: balance - totalAmount,
          status: TransactionStatus.SUCCESS,
          // method:
        },
        userId,
      );

      if (!transaction) {
        throw new BadRequestException('Thanh toán thất bại');
      }

      const createdOrder = new this.orderModel({
        ...createOrderDto,
        userId,
        transactionId: transaction._id,
        fileId,
        totalAmount,
        status: OrderStatus.COMPLETED,
      });

      await createdOrder.save();
      await this.driveService.addDrivePermission(fileId, email);
      return { urlDownload: urlDownload! };
    } catch (error) {
      // Rollback transaction if it was created
      if (transaction) {
        try {
          await this.transactionsService.deleteById(transaction._id.toString());
          // Restore user balance to initial value
          await this.usersService.updateBalance(userId, initialBalance);
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Order creation failed',
      );
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel
      .find()
      .populate('productId userId', '-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('productId userId', '-password')
      .exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }
    return order;
  }

  async findByUserId(
    userId: string,
    filterDto: FilterDto = new FilterDto(),
  ): Promise<PaginatedResult<OrderDocument>> {
    return this.filterService.applyFilters<OrderDocument>(
      this.orderModel,
      filterDto,
      {
        userId: userId,
      },
      [],
      { path: 'productId' },
    );
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    // If status is changing to CANCELLED or REFUNDED, remove drive permission
    if (
      updateOrderDto.status &&
      (updateOrderDto.status === OrderStatus.CANCELLED ||
        updateOrderDto.status === OrderStatus.REFUNDED) &&
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.REFUNDED
    ) {
      // Get user email
      const user = await this.usersService.findOne(order.userId.toString());

      // Remove drive permission
      if (order.fileId && user.email) {
        await this.driveService.removeDrivePermission(order.fileId, user.email);
      }
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    return updatedOrder;
  }

  async remove(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    // Get user email and remove drive permission
    const user = await this.usersService.findOne(order.userId.toString());
    if (order.fileId && user.email) {
      await this.driveService.removeDrivePermission(order.fileId, user.email);
    }

    const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();

    if (!deletedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    return deletedOrder;
  }

  // get ra các bán ghi có isRemoveGoogleDrive = fasle + có thời gian tạo lớn hơn 3 tiếng
  async getOrdersToRemoveGoogleDrive(): Promise<OrderToRemoveGoogleDrive[]> {
    const orders = await this.orderModel.find({ isRemoveGoogleDrive: false, createdAt: { $lte: new Date(Date.now() - 3 * 60 * 60 * 1000) } }).populate({
      path: 'productId',
      select: 'urlDownload'
    })
    .populate({
      path: 'userId',
      select: '-password'
    }).exec();
    return orders as unknown as OrderToRemoveGoogleDrive[];
  }

  async updateIsRemoveGoogleDrive(orderId: string): Promise<Order> {
    const order = await this.orderModel.findByIdAndUpdate(orderId, { isRemoveGoogleDrive: true }, { new: true }).exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${orderId}`);
    }
    return order;
  }
}

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

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
    private productsService: ProductsService,
    private driveService: GoogleDriveService,
    private filterService: FilterService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<{ urlDownload: string }> {
    const user = await this.usersService.findOne(userId);

    const { email } = user;

    const { balance } = user;
    const { productId } = createOrderDto;

    const product = await this.productsService.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { discount, urlDownload, price } = product;
    const totalAmount = discount ? price - (price * discount) / 100 : price;

    if (balance < totalAmount) {
      throw new BadRequestException('Bạn không đủ tiền để thanh toán');
    }

    const transaction = await this.transactionsService.create(
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

    const fileId = this.driveService.getIdByUrl(urlDownload!);

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
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
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
}

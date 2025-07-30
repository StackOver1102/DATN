import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './entities/order.entity';
import { UsersService } from 'src/users/users.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TransactionType } from 'src/enum/transactions.enum';
import { ProductsService } from 'src/products/products.service';
import { GoogleDriveService } from 'src/drive/google-drive.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
    private productsService: ProductsService,
    private driveService: GoogleDriveService, 
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<{urlDownload: string}> {
    const user = await this.usersService.findOne(userId);

    const { email} = user

    const { balance } = user;
    const { productId } = createOrderDto;

    const product = await this.productsService.findById(productId);
    
    console.log("product", product)
    if(!product){
      throw new NotFoundException('Product not found');
    }

    const {discount, urlDownload, price} = product
    const totalAmount = discount ? price - (price * discount / 100) : price;

    if (balance < totalAmount) {
      throw new BadRequestException('Bạn không đủ tiền để thanh toán');
    }

    const transaction = await this.transactionsService.create(
      {
        amount: totalAmount,
        type: TransactionType.PAYMENT,
        balanceBefore: balance,
        balanceAfter: balance - totalAmount,
        // method: 
      },
      userId,
    );

    if (!transaction) {
      throw new BadRequestException('Thanh toán thất bại');
    }

    
    const fileId = await this.driveService.getIdByUrl(urlDownload!);

    const createdOrder = new this.orderModel({
      ...createOrderDto,
      userId,
      transactionId: transaction._id,
      fileId,
      totalAmount
    });

    await createdOrder.save();
    await this.driveService.addDrivePermission(fileId, email);
    return {urlDownload: urlDownload!}
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

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    return updatedOrder;
  }

  async remove(id: string): Promise<Order> {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();

    if (!deletedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    return deletedOrder;
  }
}

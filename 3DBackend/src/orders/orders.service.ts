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

  /**
   * Tạo đơn hàng mới (Mua sản phẩm).
   * 
   * Quy trình:
   * 1. Kiểm tra số dư người dùng.
   * 2. Lấy thông tin sản phẩm và file ID từ Drive.
   * 3. Trừ tiền (Tạo Transaction PAYMENT).
   * 4. Lưu Order vào DB.
   * 5. Generate Signed URL (link tải nhanh 5 phút) trả về ngay cho user.
   * 6. Rollback (hoàn tiền) nếu có lỗi xảy ra trong quá trình tạo Order.
   * 
   * @param {CreateOrderDto} createOrderDto - Thông tin đơn hàng.
   * @param {string} createOrderDto.productId - ID sản phẩm cần mua.
   * @param {string} userId - ID người dùng thực hiện mua.
   * @returns {Promise<{orderId: string, downloadUrl: string, filename: string}>} - Thông tin đơn hàng và link tải.
   * @throws {NotFoundException} - Nếu sản phẩm không tồn tại.
   * @throws {BadRequestException} - Nếu không đủ số dư.
   * 
   * @example
   * // Đầu vào:
   * const createOrderDto = { productId: "507f1f77bcf86cd799439011" };
   * const userId = "60d5ec49f1b2c72b8c8e1234";
   * 
   * // Gọi hàm:
   * const result = await ordersService.create(createOrderDto, userId);
   * 
   * // Đầu ra:
   * // {
   * //   orderId: "60d5ec49f1b2c72b8c8e5678",
   * //   downloadUrl: "https://drive.google.com/uc?export=download&id=...",
   * //   filename: "model.rar"
   * // }
   */
  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<{ orderId: string; downloadUrl: string; filename: string }> {
    let transaction: TransactionDocument | null = null;
    let initialBalance = 0;
    try {
      const user = await this.usersService.findOne(userId);

      const { balance } = user;
      initialBalance = balance; // Store initial balance for rollback (Lưu số dư ban đầu để rollback nếu cần)
      const { productId } = createOrderDto;

      const product = await this.productsService.findById(productId);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const { discount, urlDownload, price } = product;
      const totalAmount = discount ? price - (price * discount) / 100 : price;

      // Kiểm tra xem đủ tiền không
      if (balance < totalAmount) {
        throw new BadRequestException(
          'Insufficient balance to complete payment',
        );
      }

      // Xác định File ID trên Google Drive
      const fileId = this.driveService.getIdByUrl(urlDownload!);
      if (!fileId) {
        throw new BadRequestException('File not found');
      }

      // Create transaction (Trừ tiền user)
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

      // Generate signed download URL (valid for 5 minutes for immediate download)
      const {
        downloadUrl: signedUrl,
        filename,
        permissionId,
      } = await this.driveService.generateSignedDownloadUrl(fileId, 5);

      // Save permission info to database for cleanup later (Lưu thông tin quyền truy cập để dọn dẹp sau này)
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5);

      await this.orderModel.findByIdAndUpdate(createdOrder._id, {
        tempPermissionId: permissionId,
        permissionExpiresAt: expirationTime,
      });

      // Return orderId and download URL
      return {
        orderId: createdOrder._id.toString(),
        downloadUrl: signedUrl,
        filename,
      };
    } catch (error) {
      // Rollback transaction if it was created (Hoàn tiền nếu lỗi)
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

  /**
   * Tải lại file từ đơn hàng đã mua.
   * - Tạo link download tạm thời (60 phút).
   * 
   * @param {string} orderId - ID đơn hàng.
   * @param {string} userId - ID người dùng (để xác thực quyền sở hữu).
   * @returns {Promise<{downloadUrl: string, filename: string, mimeType: string}>} - Thông tin download.
   * @throws {NotFoundException} - Nếu đơn hàng không tồn tại.
   * @throws {BadRequestException} - Nếu đơn hàng không thuộc user hoặc chưa hoàn thành.
   * 
   * @example
   * const result = await ordersService.downloadOrderFile("orderId", "userId");
   * // => { downloadUrl: "https://...", filename: "model.rar", mimeType: "application/x-rar" }
   */
  async downloadOrderFile(
    orderId: string,
    userId: string,
  ): Promise<{ downloadUrl: string; filename: string; mimeType: string }> {
    // Find the order and verify ownership
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify that the order belongs to the user
    if (order.userId.toString() !== userId) {
      throw new BadRequestException(
        'You are not authorized to download this file',
      );
    }

    // Verify order is completed
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Order is not completed');
    }

    // Generate temporary signed URL (valid for 60 minutes)
    return await this.driveService.generateSignedDownloadUrl(order.fileId, 60);
  }

  /**
   * Lấy tất cả đơn hàng (Admin).
   * 
   * @returns {Promise<Order[]>} - Mảng tất cả đơn hàng với thông tin product và user.
   * 
   * @example
   * const allOrders = await ordersService.findAll();
   */
  async findAll(): Promise<Order[]> {
    return this.orderModel
      .find()
      .populate('productId userId', '-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết đơn hàng.
   * 
   * @param {string} id - ID đơn hàng.
   * @returns {Promise<Order>} - Thông tin đơn hàng đầy đủ.
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * const order = await ordersService.findOne("orderId");
   */
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

  /**
   * Lấy danh sách đơn hàng của một User cụ thể.
   * Có phân trang và filter.
   * 
   * @param {string} userId - ID người dùng.
   * @param {FilterDto} [filterDto] - Tham số phân trang (page, limit).
   * @returns {Promise<PaginatedResult<OrderDocument>>} - Kết quả phân trang.
   * 
   * @example
   * const orders = await ordersService.findByUserId("userId", { page: 1, limit: 10 });
   */
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

  /**
   * Cập nhật đơn hàng (Admin).
   * - Nếu hủy đơn (CANCELLED/REFUNDED): Tự động xóa quyền truy cập file trên Drive.
   * 
   * @param {string} id - ID đơn hàng.
   * @param {UpdateOrderDto} updateOrderDto - Các trường cần cập nhật.
   * @param {OrderStatus} [updateOrderDto.status] - Trạng thái mới (PENDING, COMPLETED, CANCELLED, REFUNDED).
   * @returns {Promise<Order>} - Đơn hàng đã cập nhật.
   * 
   * @example
   * const updated = await ordersService.update("orderId", { status: OrderStatus.CANCELLED });
   */
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

      // Remove drive permission (Thu hồi quyền truy cập)
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

  /**
   * Xóa đơn hàng (Admin).
   * - Cũng tự động thu hồi quyền truy cập Drive.
   * 
   * @param {string} id - ID đơn hàng.
   * @returns {Promise<Order>} - Đơn hàng đã xóa.
   * 
   * @example
   * const deleted = await ordersService.remove("orderId");
   */
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

  /**
   * Lấy các đơn hàng cần thu hồi quyền truy cập (Logic cũ, có thể không còn sử dụng).
   * - Lấy các đơn có isRemoveGoogleDrive = false và createdAt > 3 giờ.
   * 
   * @returns {Promise<OrderToRemoveGoogleDrive[]>}
   */
  async getOrdersToRemoveGoogleDrive(): Promise<OrderToRemoveGoogleDrive[]> {
    const now = new Date();

    // Lấy thời gian UTC+7 hiện tại
    const utcPlus7Now = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    // Trừ thêm 3 giờ
    const cutoff = new Date(utcPlus7Now.getTime() - 3 * 60 * 60 * 1000);

    const orders = await this.orderModel
      .find({ isRemoveGoogleDrive: false, createdAt: { $lte: cutoff } })
      .populate({
        path: 'productId',
        select: 'urlDownload',
      })
      .populate({
        path: 'userId',
        select: '-password',
      })
      .exec();
    return orders as unknown as OrderToRemoveGoogleDrive[];
  }

  /**
   * Đánh dấu đơn hàng đã thu hồi quyền Google Drive.
   * 
   * @param {string} orderId - ID đơn hàng.
   * @returns {Promise<Order>}
   */
  async updateIsRemoveGoogleDrive(orderId: string): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(orderId, { isRemoveGoogleDrive: true }, { new: true })
      .exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${orderId}`);
    }
    return order;
  }

  /**
   * Lấy các đơn hàng có quyền truy cập tạm thời đã hết hạn để dọn dẹp.
   * - Used by Cron Job (handleCleanupExpiredPermissions).
   * 
   * @returns {Promise<OrderDocument[]>} - Mảng các đơn hàng có permission hết hạn.
   * 
   * @example
   * const expiredOrders = await ordersService.getOrdersWithExpiredPermissions();
   * // => [{ _id: "...", tempPermissionId: "...", permissionExpiresAt: "..." }]
   */
  async getOrdersWithExpiredPermissions(): Promise<OrderDocument[]> {
    const now = new Date();
    return await this.orderModel
      .find({
        tempPermissionId: { $exists: true, $ne: null },
        permissionExpiresAt: { $lte: now },
      })
      .exec();
  }

  /**
   * Xóa thông tin permission sau khi đã dọn dẹp xong.
   * 
   * @param {string} orderId - ID đơn hàng.
   * @returns {Promise<void>}
   * 
   * @example
   * await ordersService.clearPermissionInfo("orderId");
   */
  async clearPermissionInfo(orderId: string): Promise<void> {
    await this.orderModel.findByIdAndUpdate(orderId, {
      $unset: { tempPermissionId: '', permissionExpiresAt: '' },
    });
  }
}

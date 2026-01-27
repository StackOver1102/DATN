import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment, CommentDocument } from './entities/comment.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/types/notification';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private notificationService: NotificationsService,
    private productsService: ProductsService,
  ) { }

  /**
   * Tạo bình luận mới.
   * - Mặc định chưa được duyệt (isApproved: false).
   * - Tăng số lượng bình luận của sản phẩm tương ứng.
   * - Tạo thông báo mới cho Admin biết có bình luận.
   * 
   * @param {CreateCommentDto} createCommentDto - Thông tin bình luận.
   * @param {string} createCommentDto.productId - ID sản phẩm được bình luận.
   * @param {string} createCommentDto.content - Nội dung bình luận.
   * @param {number} [createCommentDto.rating] - Đánh giá sao (1-5).
   * @param {string} userId - ID người dùng tạo bình luận.
   * @returns {Promise<CommentDocument>} - Bình luận đã tạo.
   * 
   * @example
   * // Đầu vào:
   * const dto = { productId: "productId123", content: "Sản phẩm rất đẹp!", rating: 5 };
   * const userId = "userId123";
   * 
   * // Gọi hàm:
   * const comment = await commentService.create(dto, userId);
   * 
   * // Đầu ra:
   * // { _id: "...", productId: "...", userId: "...", content: "Sản phẩm rất đẹp!", isApproved: false }
   */
  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<CommentDocument> {
    const newComment = new this.commentModel({
      ...createCommentDto,
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(createCommentDto.productId),
      isApproved: false, // Auto-approve comments for now (Hiện tại mặc định false chờ duyệt)
    });

    const savedComment: CommentDocument = await newComment.save();

    // Cập nhật số lượng comment (quantityCommand) trong product
    await this.productsService.incrementQuantityCommand(createCommentDto.productId);

    // Tạo thông báo cho hệ thống
    await this.notificationService.create({
      message: `New Comment : ${createCommentDto.productId}`,
      originalId: savedComment._id.toString(),
      originType: NotificationType.COMMENT,
      userId: userId ? new Types.ObjectId(userId) : undefined,
    });

    return savedComment
  }

  /**
   * Lấy tất cả bình luận (Admin).
   * 
   * @returns {Promise<CommentDocument[]>} - Mảng tất cả bình luận với thông tin user và product.
   * 
   * @example
   * const allComments = await commentService.findAll();
   */
  async findAll(): Promise<CommentDocument[]> {
    return this.commentModel.find().populate('userId productId', 'fullName email name').sort({ createdAt: -1 }).exec();
  }

  /**
   * Lấy bình luận của một sản phẩm (Public).
   * - Chỉ lấy các bình luận đã được duyệt (isApproved: true).
   * 
   * @param {string} productId - ID sản phẩm.
   * @returns {Promise<CommentDocument[]>} - Mảng bình luận đã duyệt.
   * 
   * @example
   * const comments = await commentService.findByProductId("productId123");
   * // => [{ content: "Rất đẹp!", rating: 5, userId: {...} }, ...]
   */
  async findByProductId(productId: string): Promise<CommentDocument[]> {
    return this.commentModel
      .find({ productId: new Types.ObjectId(productId), isApproved: true })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết bình luận.
   * 
   * @param {string} id - ID bình luận.
   * @returns {Promise<CommentDocument>}
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * const comment = await commentService.findOne("commentId123");
   */
  async findOne(id: string): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(id).exec();

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  /**
   * Cập nhật nội dung bình luận.
   * 
   * @param {string} id - ID bình luận.
   * @param {UpdateCommentDto} updateCommentDto - Các trường cần cập nhật.
   * @returns {Promise<CommentDocument>}
   * 
   * @example
   * const updated = await commentService.update("commentId", { content: "Nội dung mới" });
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDocument> {
    const updatedComment = await this.commentModel
      .findByIdAndUpdate(id, updateCommentDto, { new: true })
      .exec();

    if (!updatedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return updatedComment;
  }

  /**
   * Xóa bình luận.
   * 
   * @param {string} id - ID bình luận.
   * @returns {Promise<CommentDocument>} - Bình luận đã xóa.
   * 
   * @example
   * const deleted = await commentService.remove("commentId");
   */
  async remove(id: string): Promise<CommentDocument> {
    const deletedComment = await this.commentModel.findByIdAndDelete(id).exec();

    if (!deletedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return deletedComment;
  }

  /**
   * Duyệt bình luận (Admin).
   * - Chuyển trạng thái isApproved = true để hiển thị ra ngoài Frontend.
   * 
   * @param {string} id - ID bình luận cần duyệt.
   * @returns {Promise<CommentDocument>}
   * 
   * @example
   * const approved = await commentService.approveComment("commentId");
   * // => { isApproved: true, ... }
   */
  async approveComment(id: string): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    comment.isApproved = true;
    return comment.save();
  }
}

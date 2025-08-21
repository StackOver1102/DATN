import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment, CommentDocument } from './entities/comment.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/types/notification';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private notificationService: NotificationsService,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<CommentDocument> {
    const newComment = new this.commentModel({
      ...createCommentDto,
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(createCommentDto.productId),
      isApproved: false, // Auto-approve comments for now
    });

    const savedComment:CommentDocument = await newComment.save();

    const result = await this.notificationService.create({
      message: `New Comment : ${createCommentDto.productId}`,
      originalId: savedComment._id.toString(),
      originType: NotificationType.COMMENT,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      // originType: NotificationType.COMMENT 
    });
    console.log(result);
    return savedComment
  }

  async findAll(): Promise<CommentDocument[]> {
    return this.commentModel.find().populate('userId productId', 'fullName email name').sort({ createdAt: -1 }).exec();
  }

  async findByProductId(productId: string): Promise<CommentDocument[]> {
    return this.commentModel
      .find({ productId: new Types.ObjectId(productId), isApproved: true })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(id).exec();

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

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

  async remove(id: string): Promise<CommentDocument> {
    const deletedComment = await this.commentModel.findByIdAndDelete(id).exec();

    if (!deletedComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return deletedComment;
  }

  async approveComment(id: string): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    comment.isApproved = true;
    return comment.save();
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/types';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commentService.create(createCommentDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments' })
  findAll() {
    return this.commentService.findAll();
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all comments for a product' })
  findByProductId(@Param('productId') productId: string) {
    return this.commentService.findByProductId(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by ID' })
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  remove(@Param('id') id: string) {
    return this.commentService.remove(id);
  }

  @Patch('approve/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a comment' })
  approveComment(@Param('id') id: string) {
    return this.commentService.approveComment(id);
  }
}

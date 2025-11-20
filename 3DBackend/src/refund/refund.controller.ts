import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { RefundService } from './refund.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/enum/user.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/types';
import { FilterDto } from 'src/common/dto/filter.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';

interface FileWithBuffer extends Express.Multer.File {
  buffer: Buffer;
  key: string;
}
@Controller('refunds')
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('attachments', 5))
  create(
    @Body() createRefundDto: CreateRefundDto,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() files?: FileWithBuffer[],
  ) {
    let attachments: string[] = [];
    if (files && files.length > 0) {
      attachments = files.map((file: FileWithBuffer) => {
        const url = this.uploadService.getFileUrl(file.key);
        return url;
      });
    }
    return this.refundService.create(
      {
        ...createRefundDto,
        attachments,
      },
      user.userId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.refundService.findAll();
  }

  @Get('my-refunds')
  @UseGuards(JwtAuthGuard)
  findMyRefunds(
    @CurrentUser() user: UserPayload,
    @Query() filterDto: FilterDto,
  ) {
    return this.refundService.findByUserId(user.userId, filterDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.refundService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('attachments', 5))
  async update(
    @Param('id') id: string,
    @Body() updateRefundDto: UpdateRefundDto,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() files?: FileWithBuffer[],
  ) {
    console.log('updateRefundDto', updateRefundDto);
    // Add admin user ID as the processor
    if (updateRefundDto.status) {
      updateRefundDto.processedBy = user.userId.toString();
    }

    // Process uploaded files if any

    if (files && files.length > 0) {
      const attachments = files.map((file: FileWithBuffer) => {
        const url = this.uploadService.getFileUrl(file.key);
        return url;
      });

      // Add new attachments to the DTO
      updateRefundDto.imagesByAdmin = attachments;
    }

    return this.refundService.update(id, updateRefundDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.refundService.remove(id);
  }
}

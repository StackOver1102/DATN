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
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import {
  RespondToSupportDto,
  UpdateSupportDto,
} from './dto/update-support.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/enum/user.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import {
  SupportRequestDocument,
  SupportStatus,
} from './entities/support.entity';
import { Public } from 'src/auth/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/types/notification';
import { FilterDto } from 'src/common/dto/filter.dto';
import { UserPayload } from 'src/auth/types';
import { Throttle } from '@nestjs/throttler';
interface FileWithBuffer extends Express.Multer.File {
  buffer: Buffer;
  key: string;
}

@Controller('support')
@Throttle({ default: { limit: 3, ttl: 300000 } })
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly uploadService: UploadService,
    private readonly notificationsService: NotificationsService,
  ) { }

  @Post()
  @Public()
  @UseInterceptors(FilesInterceptor('attachments', 5))
  async create(
    @Body() createSupportDto: CreateSupportDto,
    @UploadedFiles() files?: FileWithBuffer[],
  ) {
    // Upload files if any
    let attachments: string[] = [];
    if (files && files.length > 0) {
      attachments = files.map((file: FileWithBuffer) => {
        const url = this.uploadService.getFileUrl(file.key);
        return url;
      });
    }

    const support: SupportRequestDocument = await this.supportService.create({
      ...createSupportDto,
      attachments: [...(createSupportDto.attachments || []), ...attachments],
    }, createSupportDto?.userId);

    // if (support && support._id) {
    //   await this.notificationsService.create({
    //     message: `New support request from ${createSupportDto.name}`,
    //     originalId: support._id.toString(),
    //     originType: NotificationType.SUPPORT,
    //     userId: support?.userId || undefined,
    //   });
    // }

    return support;
  }

  @Post('user-request')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('attachments', 5))
  async createWithUser(
    @Body() createSupportDto: CreateSupportDto,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() files?: FileWithBuffer[],
  ) {
    // Upload files if any
    let attachments: string[] = [];
    if (files && files.length > 0) {
      attachments = await Promise.all(
        files.map(async (file) => {
          const uploadResult = await this.uploadService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            'support',
          );
          return uploadResult.url;
        }),
      );
    }

    return this.supportService.create(
      {
        ...createSupportDto,
        attachments: [...(createSupportDto.attachments || []), ...attachments],
      },
      user.userId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@Query('status') status?: SupportStatus) {
    if (status) {
      return this.supportService.findByStatus(status);
    }
    return this.supportService.findAll();
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  findMyRequests(@CurrentUser() user: UserPayload, @Query() filterDto: FilterDto) {
    return this.supportService.findByUserId(user.userId, filterDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('attachments', 5))
  async update(
    @Param('id') id: string,
    @Body() updateSupportDto: UpdateSupportDto,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() files?: FileWithBuffer[],
  ) {
    // Process uploaded files if any
    if (files && files.length > 0) {
      const attachments = files.map((file: FileWithBuffer) => {
        const url = this.uploadService.getFileUrl(file.key);
        return url;
      });
      
      // Add new attachments to the DTO
      updateSupportDto.imagesByAdmin = attachments;
    }
    
    return this.supportService.update(id, updateSupportDto, user.userId);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('attachments', 5))
  async respond(
    @Param('id') id: string,
    @Body() respondToSupportDto: RespondToSupportDto,
    @CurrentUser() admin: UserPayload,
    @UploadedFiles() files?: FileWithBuffer[],
  ) {
    // Process uploaded files if any
    if (files && files.length > 0) {
      const attachments = files.map((file: FileWithBuffer) => {
        const url = this.uploadService.getFileUrl(file.key);
        return url;
      });
      
      // Add new attachments to the DTO
      respondToSupportDto.imagesByAdmin = attachments;
    }
    
    return this.supportService.respond(id, respondToSupportDto, admin.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }
}

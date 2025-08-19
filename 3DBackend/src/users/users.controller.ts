import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDashboardUserDto } from './dto/create-dashboard-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../enum/user.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserPayload } from '../auth/types/auth.types';
import { ChangePasswordDto } from './dto/change-pass.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post('/dashboard')
  async createFromDashboard(
    @Body() createDashboardUserDto: CreateDashboardUserDto,
  ) {
    const result = await this.usersService.createFromDashboard(
      createDashboardUserDto,
    );

    // Don't return the generated password in the response for security
    // Frontend should handle displaying it to the admin
    return {
      user: result.user,
      passwordGenerated: !!result.generatedPassword,
      generatedPassword: result.generatedPassword,
    };
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @ApiBearerAuth()
  @Public()
  @Get('/with-spent')
  findAllWithSpentAmount() {
    return this.usersService.findAllWithSpentAmount();
  }

  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@CurrentUser() user: UserPayload) {
    const userData = await this.usersService.findOne(user.userId, false);
    return userData;
  }

  @ApiBearerAuth()
  @Patch('change-password')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.usersService.changePassword(
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
      user.userId,
    );
  }

  @Post('avatar')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      // Upload file to storage
      const uploadResult = await this.uploadService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'avatars',
      );

      // Update user's avatar in database
      const updatedUser = await this.usersService.update(user.userId, {
        avatar: uploadResult.url,
      });

      return {
        success: true,
        message: 'Avatar updated successfully',
        data: {
          avatar: updatedUser.avatar,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update avatar',
      };
    }
  }

  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/with-spent')
  getUserWithSpentAmount(@Param('id') id: string) {
    return this.usersService.getUserWithSpentAmount(id);
  }

  @ApiBearerAuth()
  @Patch('/:id')
  updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.usersService.update(user.userId, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch('/admin/:id')
  adminUpdate(
    @Param('id') id: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    // Prevent admin from changing their own role
    if (
      id === user.userId &&
      adminUpdateUserDto.role &&
      adminUpdateUserDto.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Admins cannot downgrade their own role');
    }
    return this.usersService.adminUpdate(id, adminUpdateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

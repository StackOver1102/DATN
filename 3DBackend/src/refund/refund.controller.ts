import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RefundService } from './refund.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/enum/user.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Types } from 'mongoose';

interface UserWithId {
  _id: string | Types.ObjectId;
  [key: string]: any;
}

@Controller('refund')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createRefundDto: CreateRefundDto,
    @CurrentUser() user: UserWithId,
  ) {
    return this.refundService.create(createRefundDto, user._id.toString());
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.refundService.findAll();
  }

  @Get('my-refunds')
  @UseGuards(JwtAuthGuard)
  findMyRefunds(@CurrentUser() user: UserWithId) {
    return this.refundService.findByUserId(user._id.toString());
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.refundService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateRefundDto: UpdateRefundDto,
    @CurrentUser() user: UserWithId,
  ) {
    // Add admin user ID as the processor
    if (updateRefundDto.status) {
      updateRefundDto.processedBy = user._id as Types.ObjectId;
    }
    return this.refundService.update(id, updateRefundDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.refundService.remove(id);
  }
}

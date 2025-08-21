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

@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  create(
    @Body() createRefundDto: CreateRefundDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.refundService.create(createRefundDto, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.refundService.findAll();
  }

  @Get('my-refunds')
  @UseGuards(JwtAuthGuard)
  findMyRefunds(@CurrentUser() user: UserPayload, @Query() filterDto: FilterDto) {
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
  update(
    @Param('id') id: string,
    @Body() updateRefundDto: UpdateRefundDto,
    @CurrentUser() user: UserPayload,
  ) {
    // Add admin user ID as the processor
    if (updateRefundDto.status) {
      updateRefundDto.processedBy = user.userId;
    }
    return this.refundService.update(id, updateRefundDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.refundService.remove(id);
  }
}

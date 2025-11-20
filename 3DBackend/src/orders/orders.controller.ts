import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Order, OrderDocument } from './entities/order.entity';
import { UserRole } from 'src/enum/user.enum';
import { UserPayload } from 'src/auth/types';
import { FilterDto } from 'src/common/dto/filter.dto';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ urlDownload: string }> {
    const { userId } = user;

    return this.ordersService.create(createOrderDto, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get()
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  // @Get('user/:userId')
  // findByUserId(
  //   @Param('userId') userId: string,
  //   @CurrentUser() user: UserPayload,
  // ): Promise<Order[]> {
  //   if (user.userId !== userId) {
  //     throw new UnauthorizedException(
  //       'You are not authorized to access this resource',
  //     );
  //   }
  //   return this.ordersService.findByUserId(userId);
  // }

  @Get('my-orders')
  findMyOrders(
    @Query() filterDto: FilterDto,
    @CurrentUser() user: UserPayload,
  ): Promise<PaginatedResult<OrderDocument>> {
    return this.ordersService.findByUserId(user.userId, filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Order> {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to access this resource',
      );
    }
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<Order> {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to access this resource',
      );
    }
    return this.ordersService.remove(id);
  }
}

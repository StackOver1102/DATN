import { Test, TestingModule } from '@nestjs/testing';
import { RefundService } from './refund.service';
import { getModelToken } from '@nestjs/mongoose';
import { Refund, RefundStatus } from './entities/refund.entity';
import { OrdersService } from '../orders/orders.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { OrderStatus } from '../orders/entities/order.entity';
import { TransactionType } from '../enum/transactions.enum';

const mockRefund = {
  _id: new Types.ObjectId(),
  userId: new Types.ObjectId(),
  orderId: new Types.ObjectId(),
  amount: 100000,
  reason: 'sản_phẩm_hỏng',
  description: 'Sản phẩm bị hỏng khi nhận được',
  status: RefundStatus.PENDING,
  save: jest.fn().mockResolvedValue(this),
};

const mockOrder = {
  _id: new Types.ObjectId(),
  userId: mockRefund.userId,
  totalAmount: 200000,
  status: OrderStatus.COMPLETED,
};

const mockTransaction = {
  _id: new Types.ObjectId(),
  amount: 100000,
  type: TransactionType.REFUND,
};

describe('RefundService', () => {
  let service: RefundService;
  let refundModel: Model<Refund>;
  let ordersService: OrdersService;
  let transactionsService: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundService,
        {
          provide: getModelToken(Refund.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            exec: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: OrdersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockOrder),
            update: jest.fn().mockResolvedValue({
              ...mockOrder,
              status: OrderStatus.REFUNDED,
            }),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        },
      ],
    }).compile();

    service = module.get<RefundService>(RefundService);
    refundModel = module.get<Model<Refund>>(getModelToken(Refund.name));
    ordersService = module.get<OrdersService>(OrdersService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a refund request', async () => {
      const createRefundDto: CreateRefundDto = {
        orderId: mockOrder._id,
        amount: 100000,
        description: 'Sản phẩm bị hỏng khi nhận được',
      };

      const userId = mockOrder.userId.toString();

      const saveSpy = jest
        .spyOn(mockRefund, 'save')
        .mockResolvedValueOnce(mockRefund);
      jest.spyOn(refundModel, 'create').mockReturnValueOnce(mockRefund as any);

      const result = await service.create(createRefundDto, userId);

      expect(saveSpy.mock.calls.length).toBeGreaterThan(0);
      expect(result).toEqual(mockRefund);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      const createRefundDto: CreateRefundDto = {
        orderId: new Types.ObjectId(),
        amount: 100000,
        description: 'Sản phẩm bị hỏng khi nhận được',
      };

      jest.spyOn(ordersService, 'findOne').mockResolvedValueOnce(null as any);

      await expect(service.create(createRefundDto, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user does not own the order', async () => {
      const createRefundDto: CreateRefundDto = {
        orderId: mockOrder._id,
        amount: 100000,
        description: 'Sản phẩm bị hỏng khi nhận được',
      };

      const differentUserId = new Types.ObjectId().toString();

      await expect(
        service.create(createRefundDto, differentUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order is already refunded', async () => {
      const createRefundDto: CreateRefundDto = {
        orderId: mockOrder._id,
        amount: 100000,
        description: 'Sản phẩm bị hỏng khi nhận được',
      };

      const userId = mockOrder.userId.toString();

      jest.spyOn(ordersService, 'findOne').mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.REFUNDED,
      } as any);

      await expect(service.create(createRefundDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if refund amount exceeds order total', async () => {
      const createRefundDto: CreateRefundDto = {
        orderId: mockOrder._id,
        amount: 300000, // More than total amount
        description: 'Sản phẩm bị hỏng khi nhận được',
      };

      const userId = mockOrder.userId.toString();

      await expect(service.create(createRefundDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a refund by id', async () => {
      jest.spyOn(refundModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefund),
      } as any);

      const result = await service.findOne(mockRefund._id.toString());

      expect(result).toEqual(mockRefund);
    });

    it('should throw NotFoundException if refund not found', async () => {
      jest.spyOn(refundModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update refund and process it when status is APPROVED', async () => {
      const updateRefundDto: UpdateRefundDto = {
        status: RefundStatus.APPROVED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockRefund as any);
      jest.spyOn(service, 'processRefund').mockResolvedValue();

      jest.spyOn(refundModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockRefund,
          status: RefundStatus.APPROVED,
        }),
      } as any);

      const result = await service.update(
        mockRefund._id.toString(),
        updateRefundDto,
      );

      expect(result).toHaveProperty('status', RefundStatus.APPROVED);
    });

    it('should update refund and mark order as refunded when status is COMPLETED', async () => {
      const updateRefundDto: UpdateRefundDto = {
        status: RefundStatus.COMPLETED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockRefund as any);

      jest.spyOn(refundModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockRefund,
          status: RefundStatus.COMPLETED,
        }),
      } as any);

      const result = await service.update(
        mockRefund._id.toString(),
        updateRefundDto,
      );

      expect(result).toHaveProperty('status', RefundStatus.COMPLETED);
    });
  });

  describe('processRefund', () => {
    it('should create a refund transaction', async () => {
      // Spying on the create method to ensure it's called
      const createSpy = jest.spyOn(transactionsService, 'create');

      await service.processRefund(mockRefund as any);

      // Check it was called at least once
      expect(createSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('remove', () => {
    it('should delete a pending refund', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRefund as any);

      jest.spyOn(refundModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRefund),
      } as any);

      const result = await service.remove(mockRefund._id.toString());

      expect(result).toEqual(mockRefund);
    });

    it('should throw BadRequestException if refund is not pending', async () => {
      const nonPendingRefund = {
        ...mockRefund,
        status: RefundStatus.APPROVED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(nonPendingRefund as any);

      await expect(service.remove(mockRefund._id.toString())).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

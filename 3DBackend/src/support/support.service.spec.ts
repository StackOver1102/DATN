import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { getModelToken } from '@nestjs/mongoose';
import { SupportRequest, SupportStatus } from './entities/support.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { RespondToSupportDto } from './dto/update-support.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';

const mockSupportRequest = {
  _id: new Types.ObjectId(),
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  phone: '0123456789',
  message: 'Tôi cần hỗ trợ về sản phẩm',
  status: SupportStatus.PENDING,
  save: jest.fn().mockResolvedValue(this),
  toObject: jest.fn().mockReturnValue(this),
};

const mockUser = {
  _id: new Types.ObjectId(),
  email: 'user@example.com',
  fullName: 'Test User',
};

describe('SupportService', () => {
  let service: SupportService;
  let supportModel: Model<SupportRequest>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getModelToken(SupportRequest.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockSupportRequest),
            constructor: jest.fn().mockResolvedValue(mockSupportRequest),
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
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendSupportRequestConfirmation: jest.fn().mockResolvedValue(true),
            sendSupportResponse: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    supportModel = module.get<Model<SupportRequest>>(
      getModelToken(SupportRequest.name),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new support request', async () => {
      const createSupportDto: CreateSupportDto = {
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0123456789',
        message: 'Tôi cần hỗ trợ về sản phẩm',
      };

      jest
        .spyOn(mockSupportRequest, 'save')
        .mockResolvedValueOnce(mockSupportRequest);
      jest
        .spyOn(supportModel, 'create')
        .mockReturnValueOnce(mockSupportRequest as any);

      const result = await service.create(createSupportDto);

      expect(result).toEqual(mockSupportRequest);
    });

    it('should create a support request with user ID if provided', async () => {
      const createSupportDto: CreateSupportDto = {
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0123456789',
        message: 'Tôi cần hỗ trợ về sản phẩm',
      };
      const userId = mockUser._id.toString();

      const supportWithUser = {
        ...mockSupportRequest,
        userId: new Types.ObjectId(userId),
      };

      jest
        .spyOn(mockSupportRequest, 'save')
        .mockResolvedValueOnce(supportWithUser);
      jest
        .spyOn(supportModel, 'create')
        .mockReturnValueOnce(mockSupportRequest as any);

      const result = await service.create(createSupportDto, userId);

      expect(result).toHaveProperty('userId');
    });
  });

  describe('findAll', () => {
    it('should return all support requests', async () => {
      const supportRequests = [mockSupportRequest];
      jest.spyOn(supportModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(supportRequests),
        }),
      } as any);

      const result = await service.findAll();

      expect(result).toEqual(supportRequests);
    });
  });

  describe('findOne', () => {
    it('should return a support request by id', async () => {
      jest.spyOn(supportModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSupportRequest),
      } as any);

      const result = await service.findOne(mockSupportRequest._id.toString());

      expect(result).toEqual(mockSupportRequest);
    });

    it('should throw NotFoundException if support request not found', async () => {
      jest.spyOn(supportModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('respond', () => {
    it('should respond to a support request', async () => {
      const respondDto: RespondToSupportDto = {
        response: 'Đây là phản hồi của chúng tôi',
        status: SupportStatus.RESOLVED,
      };

      const adminId = new Types.ObjectId().toString();

      const updatedRequest = {
        ...mockSupportRequest,
        response: respondDto.response,
        status: respondDto.status,
        respondedBy: new Types.ObjectId(adminId),
        respondedAt: new Date(),
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockSupportRequest as any);
      jest.spyOn(supportModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedRequest),
      } as any);

      const result = await service.respond(
        mockSupportRequest._id.toString(),
        respondDto,
        adminId,
      );

      expect(result).toEqual(updatedRequest);
    });

    it('should throw BadRequestException if support request is already resolved', async () => {
      const resolvedRequest = {
        ...mockSupportRequest,
        status: SupportStatus.RESOLVED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(resolvedRequest as any);

      const respondDto: RespondToSupportDto = {
        response: 'Đây là phản hồi của chúng tôi',
      };

      await expect(
        service.respond(
          mockSupportRequest._id.toString(),
          respondDto,
          mockUser._id.toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a support request', async () => {
      jest.spyOn(supportModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSupportRequest),
      } as any);

      const result = await service.remove(mockSupportRequest._id.toString());

      expect(result).toEqual(mockSupportRequest);
    });

    it('should throw NotFoundException if support request not found', async () => {
      jest.spyOn(supportModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

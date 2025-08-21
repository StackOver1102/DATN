import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateDashboardUserDto } from './dto/create-dashboard-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/enum/user.enum';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => MailService)) private mailService: MailService,
    @Inject(forwardRef(() => TransactionsService))
    private transactionsService: TransactionsService,
  ) {}

  async onModuleInit() {
    await this.createAdminIfNotExists();
  }

  async createAdminIfNotExists() {
    try {
      const adminExists = await this.userModel.findOne({
        role: UserRole.ADMIN,
      });
      if (!adminExists) {
        const adminPassword = await bcrypt.hash('admin123', 10);
        await this.userModel.create({
          fullName: 'Admin',
          email: 'admin@gmail.com',
          password: adminPassword,
          role: UserRole.ADMIN,
        });
        
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Failed to create admin user:', error);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { email, password } = createUserDto;

    const checkUser = await this.userModel.findOne({ email });

    if (checkUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash the password before saving
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      createUserDto.password = hashedPassword;
    }

    const user = await this.userModel.create(createUserDto);
    return user;
  }

  /**
   * Create a user from dashboard with optional password
   * If password is not provided, a random one will be generated
   */
  async createFromDashboard(
    createDashboardUserDto: CreateDashboardUserDto,
  ): Promise<{ user: UserDocument; generatedPassword?: string }> {
    const { email, password, sendWelcomeEmail = true } = createDashboardUserDto;

    const checkUser = await this.userModel.findOne({ email });

    if (checkUser) {
      throw new BadRequestException('User already exists');
    }

    let generatedPassword: string | undefined;
    const userData = { ...createDashboardUserDto };

    // If no password provided, generate a random one
    if (!password) {
      generatedPassword = randomBytes(8).toString('hex');
      userData.password = await bcrypt.hash(generatedPassword, 10);
    } else {
      // Hash the provided password
      userData.password = await bcrypt.hash(password, 10);
    }

    // Remove sendWelcomeEmail field as it's not part of the User entity
    delete userData.sendWelcomeEmail;

    const user = await this.userModel.create(userData);

    // Send email with credentials to the user if requested
    if (sendWelcomeEmail) {
      try {
        await this.mailService.sendNewUserCredentials(user, generatedPassword);
        console.log(`Credentials email sent to ${email}`);
      } catch (error) {
        console.error(`Failed to send credentials email to ${email}:`, error);
        // Don't fail the user creation if email sending fails
      }
    }

    return {
      user,
      generatedPassword,
    };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }

  async findAll() {
    return this.userModel.find();
  }

  /**
   * Lấy danh sách tất cả người dùng kèm theo số tiền đã tiêu
   * @returns Danh sách người dùng và số tiền đã tiêu
   */
  async findAllWithSpentAmount() {
    const users = await this.userModel.find().select('-password');
    const usersWithSpent = await Promise.all(
      users.map(async (user) => {
        const totalSpent = await this.transactionsService.getTotalSpentByUser(
          user._id.toString(),
        );
        return {
          ...user.toObject(),
          totalSpent,
        };
      }),
    );

    return usersWithSpent;
  }

  async findOne(id: string, isSelectPassword = false) {
    const user = await this.userModel.findOne(
      { _id: id },
      isSelectPassword ? null : { password: 0 },
    );
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Lấy thông tin người dùng kèm theo số tiền đã tiêu
   * @param id ID của người dùng
   * @returns Thông tin người dùng và số tiền đã tiêu
   */
  async getUserWithSpentAmount(id: string) {
    const user = await this.findOne(id);
    const totalSpent = await this.transactionsService.getTotalSpentByUser(id);

    return {
      ...user.toObject(),
      totalSpent,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Make sure user can't update role or balance through this method
    const { ...updateData } = updateUserDto;

    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async adminUpdate(id: string, adminUpdateUserDto: any) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      adminUpdateUserDto,
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async updateBalance(id: string, newBalance: number) {
    if (newBalance < 0) {
      throw new BadRequestException('Balance cannot be negative');
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { balance: newBalance },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    userId: string,
  ) {
    const user = await this.userModel.findOne({ _id: userId });
    if (!user) {
      throw new BadRequestException('Không tìm thấy tài khoản');
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  /**
   * Update user password without requiring old password
   * Used for password reset functionality
   */
  async updatePassword(userId: string, newHashedPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    user.password = newHashedPassword;
    await user.save();
    return { message: 'Password updated successfully' };
  }
}
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
  ) { }

  /**
   * Phương thức được gọi khi module khởi tạo.
   * Dùng để kiểm tra và tạo tài khoản Admin mặc định nếu chưa tồn tại.
   * 
   * @returns {Promise<void>}
   */
  async onModuleInit() {
    await this.createAdminIfNotExists();
  }

  /**
   * Tạo tài khoản Admin mặc định nếu trong hệ thống chưa có.
   * Thông tin mặc định: email: admin@gmail.com / pass: admin123
   * 
   * @returns {Promise<void>}
   * 
   * @example
   * // Được gọi tự động khi khởi động app
   * await usersService.createAdminIfNotExists();
   */
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

  /**
   * Đăng ký người dùng mới tiêu chuẩn.
   * - Kiểm tra email trùng lặp.
   * - Mã hóa mật khẩu trước khi lưu.
   * 
   * @param {CreateUserDto} createUserDto - Thông tin người dùng mới.
   * @param {string} createUserDto.email - Email đăng ký.
   * @param {string} createUserDto.password - Mật khẩu (plain text, sẽ được hash).
   * @param {string} [createUserDto.fullName] - Họ tên.
   * @returns {Promise<UserDocument>} - User đã được tạo.
   * @throws {BadRequestException} - Nếu email đã tồn tại.
   * 
   * @example
   * // Đầu vào:
   * const createUserDto = {
   *   email: "user@example.com",
   *   password: "mypassword123",
   *   fullName: "Nguyen Van A"
   * };
   * 
   * // Gọi hàm:
   * const user = await usersService.create(createUserDto);
   * 
   * // Đầu ra:
   * // { _id: "...", email: "user@example.com", fullName: "Nguyen Van A", balance: 0, ... }
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { email, password } = createUserDto;

    const checkUser = await this.userModel.findOne({ email });

    if (checkUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash the password before saving (Mã hóa mật khẩu)
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      createUserDto.password = hashedPassword;
    }

    const user = await this.userModel.create(createUserDto);
    return user;
  }

  /**
   * Tạo người dùng từ trang Dashboard quản trị.
   * - Nếu không cung cấp mật khẩu, tự động sinh mật khẩu ngẫu nhiên.
   * - Có tùy chọn gửi email thông báo tài khoản mới cho người dùng.
   * 
   * @param {CreateDashboardUserDto} createDashboardUserDto - Thông tin người dùng.
   * @param {string} createDashboardUserDto.email - Email.
   * @param {string} [createDashboardUserDto.password] - Mật khẩu (optional, sẽ tự generate nếu không có).
   * @param {boolean} [createDashboardUserDto.sendWelcomeEmail=true] - Có gửi email không.
   * @returns {Promise<{user: UserDocument, generatedPassword?: string}>} - User và password (nếu tự sinh).
   * 
   * @example
   * // Đầu vào (không có password):
   * const dto = { email: "newuser@example.com", sendWelcomeEmail: true };
   * 
   * // Gọi hàm:
   * const result = await usersService.createFromDashboard(dto);
   * 
   * // Đầu ra:
   * // { user: {...}, generatedPassword: "a1b2c3d4e5f6" }
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

    // Nếu không có password, tạo password ngẫu nhiên 8 ký tự
    if (!password) {
      generatedPassword = randomBytes(8).toString('hex');
      userData.password = await bcrypt.hash(generatedPassword, 10);
    } else {
      // Hash password được cung cấp
      userData.password = await bcrypt.hash(password, 10);
    }

    // Xóa trường sendWelcomeEmail vì nó không thuộc User entity
    delete userData.sendWelcomeEmail;

    const user = await this.userModel.create(userData);

    // Gửi email chứa thông tin đăng nhập nếu được yêu cầu
    if (sendWelcomeEmail) {
      try {
        await this.mailService.sendNewUserCredentials(user, generatedPassword);
      } catch (error) {
        console.error(`Failed to send credentials email to ${email}:`, error);
        // Không throw lỗi để admin vẫn tạo được user dù gửi mail thất bại
      }
    }

    return {
      user,
      generatedPassword,
    };
  }

  /**
   * Tìm người dùng theo Email.
   * 
   * @param {string} email - Email cần tìm.
   * @returns {Promise<UserDocument | null>} - User hoặc null.
   * 
   * @example
   * const user = await usersService.findByEmail("user@example.com");
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  /**
   * Tìm người dùng theo ID.
   * 
   * @param {string} id - MongoDB ObjectId.
   * @returns {Promise<UserDocument | null>}
   * 
   * @example
   * const user = await usersService.findById("507f1f77bcf86cd799439011");
   */
  async findById(id: string) {
    return this.userModel.findById(id);
  }

  /**
   * Lấy danh sách tất cả người dùng (cơ bản).
   * 
   * @returns {Promise<UserDocument[]>}
   * 
   * @example
   * const allUsers = await usersService.findAll();
   */
  async findAll() {
    return this.userModel.find();
  }

  /**
   * Lấy danh sách tất cả người dùng kèm theo tổng số tiền họ đã chi tiêu.
   * - Loại bỏ trường password trong kết quả trả về.
   * - Dùng TransactionsService để tính tổng tiền.
   * 
   * @returns {Promise<Array<UserDocument & {totalSpent: number}>>}
   * 
   * @example
   * const users = await usersService.findAllWithSpentAmount();
   * // => [{ email: "...", fullName: "...", totalSpent: 500000 }, ...]
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

  /**
   * Lấy chi tiết một người dùng.
   * 
   * @param {string} id - ID người dùng.
   * @param {boolean} [isSelectPassword=false] - Có trả về password không (default: false).
   * @returns {Promise<UserDocument>}
   * @throws {NotFoundException} - Nếu không tìm thấy.
   * 
   * @example
   * const user = await usersService.findOne("userId");
   * // => { _id: "...", email: "...", fullName: "...", balance: 100 }
   */
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
   * Lấy thông tin chi tiết người dùng kèm tổng số tiền đã tiêu.
   * 
   * @param {string} id - ID người dùng.
   * @returns {Promise<UserDocument & {totalSpent: number}>}
   * 
   * @example
   * const user = await usersService.getUserWithSpentAmount("userId");
   * // => { email: "...", balance: 100, totalSpent: 500000 }
   */
  async getUserWithSpentAmount(id: string) {
    const user = await this.findOne(id);
    const totalSpent = await this.transactionsService.getTotalSpentByUser(id);

    return {
      ...user.toObject(),
      totalSpent,
    };
  }

  /**
   * Cập nhật thông tin người dùng (cho user tự cập nhật).
   * - Không cho phép cập nhật role hoặc số dư (balance) qua hàm này.
   * 
   * @param {string} id - ID người dùng.
   * @param {UpdateUserDto} updateUserDto - Các trường cần cập nhật.
   * @param {string} [updateUserDto.fullName] - Họ tên mới.
   * @param {string} [updateUserDto.phone] - Số điện thoại mới.
   * @returns {Promise<UserDocument>}
   * 
   * @example
   * const updated = await usersService.update("userId", { fullName: "Nguyen Van B" });
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Chỉ cập nhật các field được phép trong DTO
    const { ...updateData } = updateUserDto;

    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  /**
   * Cập nhật thông tin người dùng (cho Admin).
   * - Admin có thể cập nhật mọi thông tin bao gồm role, balance.
   * 
   * @param {string} id - ID người dùng.
   * @param {any} adminUpdateUserDto - Các trường cần cập nhật (không giới hạn).
   * @returns {Promise<UserDocument>}
   * 
   * @example
   * const updated = await usersService.adminUpdate("userId", { role: "admin", balance: 1000 });
   */
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

  /**
   * Cập nhật số dư tài khoản người dùng.
   * - Thường được gọi sau khi nạp tiền hoặc mua hàng thành công.
   * 
   * @param {string} id - ID người dùng.
   * @param {number} newBalance - Số dư mới (không được âm).
   * @returns {Promise<UserDocument>}
   * @throws {BadRequestException} - Nếu balance < 0.
   * 
   * @example
   * // Cập nhật balance về 500k
   * await usersService.updateBalance("userId", 500000);
   */
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

  /**
   * Xóa vĩnh viễn người dùng khỏi hệ thống.
   * 
   * @param {string} id - ID người dùng.
   * @returns {Promise<UserDocument>} - User đã xóa.
   * 
   * @example
   * const deleted = await usersService.remove("userId");
   */
  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  /**
   * Đổi mật khẩu (Người dùng tự đổi).
   * - Yêu cầu nhập đúng mật khẩu cũ.
   * 
   * @param {string} oldPassword - Mật khẩu cũ (plain text).
   * @param {string} newPassword - Mật khẩu mới (plain text, sẽ được hash).
   * @param {string} userId - ID người dùng.
   * @returns {Promise<void>}
   * @throws {BadRequestException} - Nếu mật khẩu cũ sai.
   * 
   * @example
   * await usersService.changePassword("oldpass123", "newpass456", "userId");
   */
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
   * Cập nhật mật khẩu mới mà không cần mật khẩu cũ.
   * - Dùng cho tính năng "Quên mật khẩu" (Reset Password).
   * 
   * @param {string} userId - ID người dùng.
   * @param {string} newHashedPassword - Mật khẩu đã được mã hóa từ controller/auth service.
   * @returns {Promise<{message: string}>}
   * 
   * @example
   * const hashed = await bcrypt.hash("newpassword", 10);
   * await usersService.updatePassword("userId", hashed);
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

  /**
   * Xác thực người dùng (đánh dấu email đã verify).
   * 
   * @param {string} userId - ID người dùng.
   * @returns {Promise<{message: string}>}
   * 
   * @example
   * await usersService.verifyUser("userId");
   * // User.isVerified = true
   */
  async verifyUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isVerified = true;
    await user.save();
    return { message: 'User verified successfully' };
  }

  /**
   * Tìm Admin theo email (Dùng đặc biệt cho đăng nhập trang Admin).
   * 
   * @param {string} email - Email của admin.
   * @returns {Promise<UserDocument | null>}
   * 
   * @example
   * const admin = await usersService.findByEmailAndRole("admin@example.com");
   */
  async findByEmailAndRole(email: string) {
    return this.userModel.findOne({ email, role: UserRole.ADMIN });
  }
}
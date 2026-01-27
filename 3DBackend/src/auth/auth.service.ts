import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtPayload, JwtToken } from './types/auth.types';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { CaptchaService } from 'src/common/services/captcha.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
    private captchaService: CaptchaService,
  ) { }

  /**
   * Đăng nhập người dùng thông thường.
   * - Xác thực CAPTCHA (nếu có).
   * - Kiểm tra email có tồn tại không.
   * - Kiểm tra tài khoản đã xác thực email chưa.
   * - So khớp mật khẩu.
   * - Nếu hợp lệ, trả về JWT Access Token và thông tin user.
   * 
   * @param {LoginDto} loginDto - Thông tin đăng nhập.
   * @param {string} loginDto.email - Email đăng nhập.
   * @param {string} loginDto.password - Mật khẩu (plain text).
   * @param {string} [loginDto.captchaToken] - Token CAPTCHA (optional).
   * @returns {Promise<JwtToken>} - Object chứa access_token và thông tin user.
   * @throws {UnauthorizedException} - Nếu thông tin sai hoặc chưa xác thực.
   * 
   * @example
   * // Đầu vào:
   * const loginDto = { email: "user@example.com", password: "mypassword123", captchaToken: "abc..." };
   * 
   * // Gọi hàm:
   * const result = await authService.login(loginDto);
   * 
   * // Đầu ra:
   * // {
   * //   access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   * //   user: { _id: "...", email: "user@example.com", fullName: "...", balance: 100 }
   * // }
   */
  async login(loginDto: LoginDto): Promise<JwtToken> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User not verified');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user?._id?.toString() || '',
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        address: user.address,
        phone: user.phone,
        balance: user.balance,
      },
    };
  }

  /**
   * Helper: Mã hóa mật khẩu (hash) với cost factor = 10.
   * 
   * @param {string} password - Mật khẩu plain text.
   * @returns {Promise<string>} - Mật khẩu đã mã hóa.
   * 
   * @example
   * const hashed = await authService.hashPassword("mypassword");
   * // => "$2b$10$..."
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Đăng ký tài khoản mới.
   * - Xác thực CAPTCHA.
   * - Tạo user trong DB (thông qua UsersService).
   * - Sinh token xác thực email (thời hạn 24h).
   * - Gửi email xác thực tài khoản.
   * 
   * @param {CreateUserDto} createUserDto - Thông tin đăng ký.
   * @param {string} createUserDto.email - Email.
   * @param {string} createUserDto.password - Mật khẩu.
   * @param {string} [createUserDto.fullName] - Họ tên.
   * @param {string} [createUserDto.captchaToken] - Token CAPTCHA.
   * @returns {Promise<UserDocument>} - User đã tạo (chưa xác thực).
   * 
   * @example
   * const user = await authService.registerUser({
   *   email: "newuser@example.com",
   *   password: "password123",
   *   fullName: "Nguyen Van A",
   *   captchaToken: "abc..."
   * });
   */
  async registerUser(createUserDto: CreateUserDto) {
    // Hash the password before creating the user
    try {
      // Remove captchaToken from data before saving
      const { captchaToken: _captchaToken, ...userData } = createUserDto;

      console.log(_captchaToken)
      const user = await this.usersService.create({
        ...userData,
      });

      // Generate verification token (mã thông báo xác thực)
      const token = this.jwtService.sign(
        { email: user.email, purpose: 'email_verification' },
        { expiresIn: '24h' }, // Token hết hạn sau 24h
      );

      // Send verification email instead of welcome email
      await this.mailService.sendAccountVerificationEmail(user, token);

      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /**
   * Xác thực tài khoản qua email.
   * - Giải mã token từ link email.
   * - Kiểm tra token có đúng mục đích 'email_verification' không.
   * - Cập nhật trạng thái `isVerified = true` cho user.
   * - Gửi email chào mừng sau khi xác thực thành công.
   * 
   * @param {string} token - JWT token từ link email.
   * @returns {Promise<{message: string}>}
   * @throws {UnauthorizedException} - Nếu token không hợp lệ hoặc hết hạn.
   * 
   * @example
   * await authService.verifyAccount("eyJhbGciOiJIUzI1NiIsInR5cCI6...");
   * // => { message: "Email has been verified successfully" }
   */
  async verifyAccount(token: string) {
    try {
      // Verify and decode the token
      const decoded = this.jwtService.verify(token);

      // Check if token was issued for email verification
      if (decoded.purpose !== 'email_verification') {
        throw new UnauthorizedException('Invalid token purpose');
      }

      // Find the user by email from token
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update user's verification status
      await this.usersService.verifyUser(user._id.toString());

      // Send welcome email after verification
      await this.mailService.sendWelcomeEmail(user);

      return { message: 'Email has been verified successfully' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Verification token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid verification token');
      }
      throw error;
    }
  }

  /**
   * Gửi lại email xác thực (nếu người dùng chưa nhận được hoặc token hết hạn).
   * - Kiểm tra user tồn tại và chưa xác thực.
   * - Sinh token mới và gửi lại email.
   * 
   * @param {string} email - Email của user.
   * @returns {Promise<{message: string}>}
   * 
   * @example
   * await authService.resendVerificationEmail("user@example.com");
   */
  async resendVerificationEmail(email: string) {
    try {
      // Find the user by email
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if the user is already verified
      if (user.isVerified) {
        return { message: 'User is already verified' };
      }

      // Generate a new verification token
      const token = this.jwtService.sign(
        { email: user.email, purpose: 'email_verification' },
        { expiresIn: '24h' },
      );

      // Send the verification email
      await this.mailService.sendAccountVerificationEmail(user, token);

      return { message: 'Verification email has been sent successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Yêu cầu đặt lại mật khẩu (Forgot Password).
   * - Xác thực CAPTCHA.
   * - Kiểm tra email tồn tại.
   * - Gửi email chứa link reset password (kèm token).
   * 
   * @param {Object} forgotPasswordDto - Thông tin yêu cầu.
   * @param {string} forgotPasswordDto.email - Email cần reset.
   * @param {string} forgotPasswordDto.captchaToken - Token CAPTCHA.
   * @returns {Promise<{message: string}>}
   * 
   * @example
   * await authService.forgotPassword({ email: "user@example.com", captchaToken: "..." });
   */
  async forgotPassword(forgotPasswordDto: {
    email: string;
    captchaToken: string;
  }) {
    // Verify CAPTCHA before processing
    const isCaptchaValid = await this.captchaService.verifyCaptcha(
      forgotPasswordDto.captchaToken,
    );

    if (!isCaptchaValid) {
      throw new BadRequestException('Invalid CAPTCHA verification');
    }

    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const token = this.jwtService.sign(
      { email: forgotPasswordDto.email, purpose: 'password_reset' },
      { expiresIn: '24h' },
    );
    await this.mailService.sendResetPasswordEmail(user, token);
    return { message: 'Reset password email sent' };
  }

  /**
   * Đặt lại mật khẩu mới (Reset Password).
   * - Xác thực CAPTCHA.
   * - Kiểm tra token trong link có hợp lệ và đúng mục đích 'password_reset' không.
   * - Mã hóa mật khẩu mới và cập nhật vào DB.
   * 
   * @param {ResetPasswordDto} resetPasswordDto - Thông tin reset.
   * @param {string} resetPasswordDto.token - Token từ link email.
   * @param {string} resetPasswordDto.password - Mật khẩu mới.
   * @param {string} resetPasswordDto.captchaToken - Token CAPTCHA.
   * @returns {Promise<{message: string}>}
   * 
   * @example
   * await authService.resetPassword({
   *   token: "eyJhbGciOiJIUz...",
   *   password: "newpassword123",
   *   captchaToken: "..."
   * });
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { captchaToken } = resetPasswordDto;

      const isCaptchaValid =
        await this.captchaService.verifyCaptcha(captchaToken);

      if (!isCaptchaValid) {
        throw new UnauthorizedException('Invalid captcha');
      }

      // Verify and decode the token
      const decoded = this.jwtService.verify(resetPasswordDto.token);

      // Check if token was issued for password reset
      if (decoded.purpose !== 'password_reset') {
        throw new UnauthorizedException('Invalid token purpose');
      }

      // Find the user by email from token
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash the new password
      const hashedPassword = await this.hashPassword(resetPasswordDto.password);

      // Update user's password
      await this.usersService.updatePassword(
        user._id.toString(),
        hashedPassword,
      );

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Password reset token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid password reset token');
      }
      throw error;
    }
  }

  /**
   * Đăng nhập giả lập qua mã QR (ít dùng).
   * 
   * @param {LoginDto} loginDto - Thông tin đăng nhập.
   * @returns {Promise<{access_token: string, token_type: string, expires_in: number}>}
   */
  async loginByVQR(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: { username: string } = {
      username: email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: 86400,
    };
  }

  /**
   * Kiểm tra tính hợp lệ của token JWT.
   * 
   * @param {string} token - JWT token.
   * @returns {Promise<JwtPayload>} - Payload đã giải mã.
   * 
   * @example
   * const payload = await authService.verifyToken("eyJhbGciOiJIUz...");
   * // => { sub: "userId", email: "user@example.com", role: "user" }
   */
  async verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_SECRET'),
    });
  }

  /**
   * Đăng nhập dành riêng cho Admin (loginByAdmin).
   * - Chỉ user có role ADMIN mới đăng nhập được qua cổng này.
   * 
   * @param {LoginDto} loginDto - Thông tin đăng nhập.
   * @param {string} loginDto.email - Email admin.
   * @param {string} loginDto.password - Mật khẩu.
   * @returns {Promise<JwtToken>} - Access token và thông tin admin.
   * 
   * @example
   * const result = await authService.loginByAdmin({ email: "admin@example.com", password: "admin123" });
   */
  async loginByAdmin(loginDto: LoginDto): Promise<JwtToken> {
    const { email, password } = loginDto;

    // Tìm user với email và role ADMIN
    const user = await this.usersService.findByEmailAndRole(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user?._id?.toString() || '',
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        address: user.address,
        phone: user.phone,
        balance: user.balance,
      },
    };
  }

  /**
   * Kiểm tra xem một email đã được xác thực chưa.
   * 
   * @param {string} email - Email cần kiểm tra.
   * @returns {Promise<boolean>} - true nếu đã xác thực.
   * 
   * @example
   * const isVerified = await authService.checkUserHasVerified("user@example.com");
   * // => true / false
   */
  async checkUserHasVerified(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.isVerified;
  }
}

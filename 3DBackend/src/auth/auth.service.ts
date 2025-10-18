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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) { }

  async login(loginDto: LoginDto): Promise<JwtToken> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

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

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async registerUser(createUserDto: CreateUserDto) {
    // Hash the password before creating the user
    try {
      // const hashedPassword = await this.hashPassword(createUserDto.password);
      const user = await this.usersService.create({
        ...createUserDto,
        // password: hashedPassword,
      });

      // await this.mailService.sendWelcomeEmail(user);

      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const token = this.jwtService.sign(
      { email, purpose: 'password_reset' },
      { expiresIn: '24h' }
    );
    await this.mailService.sendResetPasswordEmail(user, token);
    return { message: 'Reset password email sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
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
      await this.usersService.updatePassword(user._id.toString(), hashedPassword);

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
      expires_in: 86400
    };
  }

  async verifyToken(token: string) {
    return this.jwtService.verify(token, { secret: this.configService.get('JWT_SECRET') });
  }

  async loginByAdmin(loginDto: LoginDto): Promise<JwtToken> {
    const { email, password } = loginDto;

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
}

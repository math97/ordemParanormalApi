import {
  Injectable,
  ConflictException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { EnvService } from '../../env/env.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { TokenResponseDto } from './dtos/token-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export const USER_REPOSITORY = 'USER_REPOSITORY';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'passwordHash'>> {
    const existingByEmail = await this.userRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingByUsername = await this.userRepository.findByUsername(
      dto.username,
    );
    if (existingByUsername) {
      throw new ConflictException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      displayName: dto.displayName,
      avatarUrl: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _omitted, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.envService.get('JWT_SECRET'),
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(user: User): TokenResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const expiresIn = this.envService.get('JWT_EXPIRES_IN');
    const refreshExpiresIn = this.envService.get('JWT_REFRESH_EXPIRES_IN');

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}

import { Injectable, ConflictException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { RegisterDto } from './dtos/register.dto';

export const USER_REPOSITORY = 'USER_REPOSITORY';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
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
}

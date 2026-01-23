import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { InMemoryUserRepository } from '../../database/in-memory-user.repository';
import { EnvService } from '../../env/env.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: InMemoryUserRepository;
  let jwtService: JwtService;
  let envService: EnvService;

  const mockEnvService = {
    get: vi.fn((key: string) => {
      const envMap: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '1h',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return envMap[key];
    }),
  } as unknown as EnvService;

  const mockJwtVerify = vi.fn();
  const mockJwtSign = vi.fn(() => 'mock-token');
  const mockJwtService = {
    sign: mockJwtSign,
    verify: mockJwtVerify,
  } as unknown as JwtService;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    jwtService = mockJwtService;
    envService = mockEnvService;

    authService = new AuthService(userRepository, jwtService, envService);

    vi.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterDto: RegisterDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      const result = await authService.register(validRegisterDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(validRegisterDto.email.toLowerCase());
      expect(result.username).toBe(validRegisterDto.username);
      expect(result.displayName).toBe(validRegisterDto.displayName);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should not return passwordHash in the response', async () => {
      const result = await authService.register(validRegisterDto);

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should hash the password before storing', async () => {
      await authService.register(validRegisterDto);

      const users = userRepository.getAll();
      expect(users).toHaveLength(1);
      expect(users[0].passwordHash).not.toBe(validRegisterDto.password);
      expect(users[0].passwordHash).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('should throw ConflictException when email already exists', async () => {
      await authService.register(validRegisterDto);

      const duplicateEmailDto: RegisterDto = {
        ...validRegisterDto,
        username: 'differentuser',
      };

      await expect(authService.register(duplicateEmailDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.register(duplicateEmailDto)).rejects.toThrow(
        'Email already in use',
      );
    });

    it('should throw ConflictException when email exists with different casing', async () => {
      await authService.register(validRegisterDto);

      const upperCaseEmailDto: RegisterDto = {
        ...validRegisterDto,
        email: 'TEST@EXAMPLE.COM',
        username: 'differentuser',
      };

      await expect(authService.register(upperCaseEmailDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.register(upperCaseEmailDto)).rejects.toThrow(
        'Email already in use',
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      await authService.register(validRegisterDto);

      const duplicateUsernameDto: RegisterDto = {
        ...validRegisterDto,
        email: 'different@example.com',
      };

      await expect(authService.register(duplicateUsernameDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.register(duplicateUsernameDto)).rejects.toThrow(
        'Username already in use',
      );
    });

    it('should normalize email to lowercase when storing', async () => {
      const upperCaseEmailDto: RegisterDto = {
        ...validRegisterDto,
        email: 'TEST@EXAMPLE.COM',
      };

      const result = await authService.register(upperCaseEmailDto);

      expect(result.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    const validLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      await authService.register(registerDto);
    });

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login(validLoginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeDefined();
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      const invalidEmailDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(authService.login(invalidEmailDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(invalidEmailDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const invalidPasswordDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(invalidPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(invalidPasswordDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should login successfully with email in different casing', async () => {
      const upperCaseEmailDto: LoginDto = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      const result = await authService.login(upperCaseEmailDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should throw UnauthorizedException when user no longer exists', async () => {
      mockJwtVerify.mockReturnValue({
        sub: 'non-existent-id',
        email: 'test@example.com',
        username: 'testuser',
        type: 'refresh',
      });

      await expect(authService.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when using access token for refresh', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      };
      const user = await authService.register(registerDto);
      const users = userRepository.getAll();

      mockJwtVerify.mockReturnValue({
        sub: users[0].id,
        email: user.email,
        username: user.username,
        type: 'access',
      });

      await expect(authService.refreshToken('access-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshToken('access-token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should return new tokens for valid refresh token', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      };
      const user = await authService.register(registerDto);
      const users = userRepository.getAll();

      mockJwtVerify.mockReturnValue({
        sub: users[0].id,
        email: user.email,
        username: user.username,
        type: 'refresh',
      });

      const result = await authService.refreshToken('valid-token');

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { registerSchema } from './register.dto';

describe('registerSchema', () => {
  describe('email validation', () => {
    it('should accept valid email', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = registerSchema.safeParse({
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('should normalize email to lowercase', () => {
      const result = registerSchema.safeParse({
        email: 'TEST@EXAMPLE.COM',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject empty email', () => {
      const result = registerSchema.safeParse({
        email: '',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('username validation', () => {
    it('should accept valid username', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser123',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
    });

    it('should accept username with underscores', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'test_user_123',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
    });

    it('should reject username shorter than 3 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'ab',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Username must be at least 3 characters',
        );
      }
    });

    it('should reject username longer than 30 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'a'.repeat(31),
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Username must be at most 30 characters',
        );
      }
    });

    it('should reject username with special characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'test@user',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Username can only contain letters, numbers and underscores',
        );
      }
    });

    it('should reject username with spaces', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'test user',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('password validation', () => {
    it('should accept password with 8 or more characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'pass',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Password must be at least 8 characters',
        );
      }
    });

    it('should reject empty password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: '',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('displayName validation', () => {
    it('should accept valid display name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty display name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        displayName: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display name is required');
      }
    });

    it('should reject display name longer than 100 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        displayName: 'a'.repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Display name must be at most 100 characters',
        );
      }
    });
  });

  describe('missing fields', () => {
    it('should reject when email is missing', () => {
      const result = registerSchema.safeParse({
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
    });

    it('should reject when username is missing', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
    });

    it('should reject when password is missing', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
    });

    it('should reject when displayName is missing', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });
  });
});

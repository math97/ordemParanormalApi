import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { randomUUID } from 'crypto';

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((user) => user.id === id) ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    return Promise.resolve(
      this.users.find((user) => user.email.toLowerCase() === normalizedEmail) ??
        null,
    );
  }

  findByUsername(username: string): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.username === username) ?? null,
    );
  }

  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const newUser: User = {
      ...user,
      email: user.email.toLowerCase(),
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  update(id: string, data: Partial<User>): Promise<User> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...this.users[index],
      ...data,
      updatedAt: new Date(),
    };
    this.users[index] = updatedUser;
    return Promise.resolve(updatedUser);
  }

  delete(id: string): Promise<void> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    this.users.splice(index, 1);
    return Promise.resolve();
  }

  clear(): void {
    this.users = [];
  }

  getAll(): User[] {
    return [...this.users];
  }
}

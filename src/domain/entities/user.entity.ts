export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

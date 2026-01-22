import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService, USER_REPOSITORY } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { PrismaUserRepository } from '../../database/prisma-user.repository';

@Module({
  controllers: [AuthController],
  providers: [
    PrismaService,
    AuthService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}

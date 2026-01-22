import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService, USER_REPOSITORY } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { PrismaUserRepository } from '../../database/prisma-user.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EnvModule } from '../../env/env.module';
import { EnvService } from '../../env/env.service';

@Module({
  imports: [
    EnvModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService): JwtModuleOptions => {
        const expiresIn = envService.get('JWT_EXPIRES_IN');
        return {
          secret: envService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as NonNullable<
              JwtModuleOptions['signOptions']
            >['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}

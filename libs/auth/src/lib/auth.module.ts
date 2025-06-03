import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../../api/src/app/users/users.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { OrgGuard } from './guards/org.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, OrgGuard],
  exports: [AuthService, JwtStrategy, RolesGuard, OrgGuard],
})
export class AuthModule {}

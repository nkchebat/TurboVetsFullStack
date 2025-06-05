import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '@turbovets/data';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { OrgGuard } from './guards/org.guard';
import { OrganizationHierarchyGuard } from './guards/organization-hierarchy.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
    TypeOrmModule.forFeature([Organization]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    OrgGuard,
    OrganizationHierarchyGuard,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    OrgGuard,
    OrganizationHierarchyGuard,
  ],
})
export class AuthModule {}

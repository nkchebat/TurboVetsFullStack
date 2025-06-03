import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(['Owner', 'Admin', 'Viewer'])
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  organizationId?: number;
}

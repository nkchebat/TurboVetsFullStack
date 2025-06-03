import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['todo', 'in-progress', 'done'])
  @IsOptional()
  status?: TaskStatus;

  @IsOptional()
  organizationId?: number;
}

import { IsString, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsOptional()
  parentOrgId?: number;
}

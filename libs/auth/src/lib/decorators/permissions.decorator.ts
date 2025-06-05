import { SetMetadata } from '@nestjs/common';
import {
  Permission,
  PERMISSIONS_KEY,
} from '../guards/organization-hierarchy.guard';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

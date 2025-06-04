import { createAction, props } from '@ngrx/store';
import { Organization } from '../../core/api.service';

// Load organizations
export const loadOrganizations = createAction(
  '[Organization] Load Organizations'
);
export const loadOrganizationsSuccess = createAction(
  '[Organization] Load Organizations Success',
  props<{ organizations: Organization[] }>()
);
export const loadOrganizationsFailure = createAction(
  '[Organization] Load Organizations Failure',
  props<{ error: string }>()
);

// Create organization
export const createOrganization = createAction(
  '[Organization] Create Organization',
  props<{ organization: Partial<Organization> }>()
);
export const createOrganizationSuccess = createAction(
  '[Organization] Create Organization Success',
  props<{ organization: Organization }>()
);
export const createOrganizationFailure = createAction(
  '[Organization] Create Organization Failure',
  props<{ error: string }>()
);

// Set current organization
export const setCurrentOrganization = createAction(
  '[Organization] Set Current Organization',
  props<{ organizationId: number }>()
);

// Clear organization state
export const clearOrganizations = createAction(
  '[Organization] Clear Organizations'
);

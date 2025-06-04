import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OrganizationState } from '../reducers/organization.reducer';

export const selectOrganizationState =
  createFeatureSelector<OrganizationState>('organization');

export const selectOrganizations = createSelector(
  selectOrganizationState,
  (state) => state.organizations
);

export const selectCurrentOrganizationId = createSelector(
  selectOrganizationState,
  (state) => state.currentOrganizationId
);

export const selectCurrentOrganization = createSelector(
  selectOrganizations,
  selectCurrentOrganizationId,
  (organizations, currentId) =>
    organizations.find((org) => org.id === currentId) || null
);

export const selectOrganizationLoading = createSelector(
  selectOrganizationState,
  (state) => state.loading
);

export const selectOrganizationError = createSelector(
  selectOrganizationState,
  (state) => state.error
);

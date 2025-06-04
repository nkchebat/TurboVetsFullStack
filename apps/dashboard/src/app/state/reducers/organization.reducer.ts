import { createReducer, on } from '@ngrx/store';
import { Organization } from '../../core/api.service';
import * as OrganizationActions from '../actions/organization.actions';

export interface OrganizationState {
  organizations: Organization[];
  currentOrganizationId: number | null;
  loading: boolean;
  error: string | null;
}

export const initialState: OrganizationState = {
  organizations: [],
  currentOrganizationId: 1, // Default to first organization
  loading: false,
  error: null,
};

export const organizationReducer = createReducer(
  initialState,

  // Load organizations
  on(OrganizationActions.loadOrganizations, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(
    OrganizationActions.loadOrganizationsSuccess,
    (state, { organizations }) => ({
      ...state,
      organizations,
      loading: false,
      error: null,
    })
  ),

  on(OrganizationActions.loadOrganizationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create organization
  on(OrganizationActions.createOrganization, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(
    OrganizationActions.createOrganizationSuccess,
    (state, { organization }) => ({
      ...state,
      organizations: [...state.organizations, organization],
      loading: false,
      error: null,
    })
  ),

  on(OrganizationActions.createOrganizationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Set current organization
  on(
    OrganizationActions.setCurrentOrganization,
    (state, { organizationId }) => ({
      ...state,
      currentOrganizationId: organizationId,
    })
  ),

  // Clear organizations
  on(OrganizationActions.clearOrganizations, () => initialState)
);

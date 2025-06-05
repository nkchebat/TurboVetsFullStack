import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Organization, ApiService } from '../../../core/api.service';
import { selectUserRole } from '../../../state/selectors';
import * as OrganizationActions from '../../../state/actions/organization.actions';
import {
  selectOrganizations,
  selectCurrentOrganization,
  selectOrganizationLoading,
  selectOrganizationError,
} from '../../../state/selectors/organization.selectors';

interface ErrorNotification {
  message: string;
  type: 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-organization-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-dropdown.component.html',
})
export class OrganizationDropdownComponent implements OnInit, OnDestroy {
  organizations$: Observable<Organization[]>;
  currentOrganization$: Observable<Organization | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  userRole$: Observable<string>;

  isOpen = false;
  errorNotification: ErrorNotification | null = null;

  private destroy$ = new Subject<void>();

  constructor(private store: Store, private apiService: ApiService) {
    this.organizations$ = this.store.select(selectOrganizations);
    this.currentOrganization$ = this.store.select(selectCurrentOrganization);
    this.loading$ = this.store.select(selectOrganizationLoading);
    this.error$ = this.store.select(selectOrganizationError);
    this.userRole$ = this.store.select(selectUserRole);
  }

  ngOnInit(): void {
    // Load organizations on component initialization
    this.store.dispatch(OrganizationActions.loadOrganizations());

    // Close dropdown when role changes (cleanup)
    this.userRole$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isOpen = false;
      this.clearError();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.clearError();
  }

  selectOrganization(organization: Organization): void {
    console.log(
      '[ORG DROPDOWN] Attempting to select organization:',
      organization
    );

    try {
      // Log current state before change
      console.log('[ORG DROPDOWN] Current API service state before change:');
      console.log(
        '  - Current Org ID:',
        this.apiService.getCurrentOrganization()
      );
      console.log(
        '  - Current User Role:',
        this.apiService.getCurrentUserRole()
      );

      // Update API service FIRST (synchronously) to avoid race conditions
      this.apiService.setCurrentOrganization(organization.id);
      console.log(
        '[ORG DROPDOWN] Updated API service organization to:',
        organization.id
      );

      // Verify the change was applied
      console.log('[ORG DROPDOWN] API service state after change:');
      console.log(
        '  - Current Org ID:',
        this.apiService.getCurrentOrganization()
      );
      console.log(
        '  - Current User Role:',
        this.apiService.getCurrentUserRole()
      );

      // Then dispatch to store
      this.store.dispatch(
        OrganizationActions.setCurrentOrganization({
          organizationId: organization.id,
        })
      );
      this.isOpen = false;
      this.clearError();
      console.log(
        '[ORG DROPDOWN] Successfully selected organization:',
        organization.name
      );
    } catch (error: any) {
      console.error('[ORG DROPDOWN] Error selecting organization:', error);
      this.showError(error.message || 'Failed to switch organization');
    }
  }

  trackByOrgId(index: number, org: Organization): number {
    return org.id;
  }

  private showError(message: string): void {
    this.errorNotification = {
      message,
      type: 'error',
    };

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      this.clearError();
    }, 5000);
  }

  private clearError(): void {
    this.errorNotification = null;
  }

  dismissError(): void {
    this.clearError();
  }
}

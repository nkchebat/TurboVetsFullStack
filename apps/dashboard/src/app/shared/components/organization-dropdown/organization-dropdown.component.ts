import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { Organization, ApiService } from '../../../core/api.service';
import { selectUserRole } from '../../../state/selectors';
import * as OrganizationActions from '../../../state/actions/organization.actions';
import {
  selectOrganizations,
  selectCurrentOrganization,
  selectOrganizationLoading,
  selectOrganizationError,
} from '../../../state/selectors/organization.selectors';
import { Actions, ofType } from '@ngrx/effects';

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
  showingAddForm = false;
  newOrgName = '';
  errorNotification: ErrorNotification | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private actions$: Actions,
    private apiService: ApiService
  ) {
    this.organizations$ = this.store.select(selectOrganizations);
    this.currentOrganization$ = this.store.select(selectCurrentOrganization);
    this.loading$ = this.store.select(selectOrganizationLoading);
    this.error$ = this.store.select(selectOrganizationError);
    this.userRole$ = this.store.select(selectUserRole);
  }

  ngOnInit(): void {
    // Load organizations on component initialization
    this.store.dispatch(OrganizationActions.loadOrganizations());

    // Listen for role changes and close dropdown if switching from Owner to non-Owner
    this.userRole$.pipe(takeUntil(this.destroy$)).subscribe((role) => {
      if (role !== 'Owner') {
        // Close dropdown and forms when switching to Admin/Viewer
        this.isOpen = false;
        this.showingAddForm = false;
        this.newOrgName = '';
        this.clearError();
      }
    });

    // Listen for organization creation success to close the form
    this.actions$
      .pipe(
        ofType(OrganizationActions.createOrganizationSuccess),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.showingAddForm = false;
        this.newOrgName = '';
        this.isOpen = false;
      });

    // Listen for organization creation failure
    this.actions$
      .pipe(
        ofType(OrganizationActions.createOrganizationFailure),
        takeUntil(this.destroy$)
      )
      .subscribe(({ error }) => {
        console.error('Failed to create organization:', error);
        this.showError('Failed to create organization: ' + error);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.showingAddForm = false; // Close add form when toggling
    this.clearError();
  }

  selectOrganization(organization: Organization): void {
    console.log(
      '[ORG DROPDOWN] Attempting to select organization:',
      organization
    );

    try {
      // Check if user has access to this organization
      if (!this.apiService.canAccessOrganization(organization.id)) {
        const userRole = this.apiService.getCurrentUserRole();
        this.showError(
          `Access denied: ${userRole} users can only access their assigned organization.`
        );
        return;
      }

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

  showAddForm(): void {
    const userRole = this.apiService.getCurrentUserRole();

    // Only Owners can create organizations
    if (userRole !== 'Owner') {
      this.showError(`Access denied: Only Owners can create organizations.`);
      return;
    }

    this.showingAddForm = true;
    this.clearError();
  }

  hideAddForm(): void {
    this.showingAddForm = false;
    this.newOrgName = '';
    this.clearError();
  }

  addOrganization(): void {
    if (!this.newOrgName.trim()) {
      this.showError('Organization name cannot be empty');
      return;
    }

    const userRole = this.apiService.getCurrentUserRole();
    if (userRole !== 'Owner') {
      this.showError('Access denied: Only Owners can create organizations.');
      return;
    }

    console.log('[ORG DROPDOWN] Creating organization:', this.newOrgName);
    this.store.dispatch(
      OrganizationActions.createOrganization({
        organization: { name: this.newOrgName.trim() },
      })
    );
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

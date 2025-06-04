import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { Organization } from '../../../core/api.service';
import * as OrganizationActions from '../../../state/actions/organization.actions';
import {
  selectOrganizations,
  selectCurrentOrganization,
  selectOrganizationLoading,
  selectOrganizationError,
} from '../../../state/selectors/organization.selectors';
import { Actions, ofType } from '@ngrx/effects';

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

  isOpen = false;
  showingAddForm = false;
  newOrgName = '';

  private destroy$ = new Subject<void>();

  constructor(private store: Store, private actions$: Actions) {
    this.organizations$ = this.store.select(selectOrganizations);
    this.currentOrganization$ = this.store.select(selectCurrentOrganization);
    this.loading$ = this.store.select(selectOrganizationLoading);
    this.error$ = this.store.select(selectOrganizationError);
  }

  ngOnInit(): void {
    console.log('[ORG DROPDOWN] Initializing and loading organizations');
    // Load organizations on init
    this.store.dispatch(OrganizationActions.loadOrganizations());

    // Listen for successful organization creation
    this.actions$
      .pipe(
        ofType(OrganizationActions.createOrganizationSuccess),
        takeUntil(this.destroy$)
      )
      .subscribe(({ organization }) => {
        console.log(
          '[ORG DROPDOWN] Organization created successfully:',
          organization
        );
        // Hide the add form after successful creation
        this.hideAddForm();
      });

    // Listen for organization creation failures
    this.actions$
      .pipe(
        ofType(OrganizationActions.createOrganizationFailure),
        takeUntil(this.destroy$)
      )
      .subscribe(({ error }) => {
        console.error('[ORG DROPDOWN] Organization creation failed:', error);
        // Keep the form open so user can retry
      });

    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    console.log('[ORG DROPDOWN] Toggled dropdown, isOpen:', this.isOpen);
  }

  selectOrganization(organization: Organization): void {
    console.log('[ORG DROPDOWN] Selecting organization:', organization);
    this.store.dispatch(
      OrganizationActions.setCurrentOrganization({
        organizationId: organization.id,
      })
    );
    this.isOpen = false;
  }

  showAddForm(): void {
    console.log('[ORG DROPDOWN] Showing add form');
    this.showingAddForm = true;
    this.isOpen = false;
    this.newOrgName = '';

    // Focus on input after a short delay to ensure it's rendered
    setTimeout(() => {
      const input = document.getElementById('orgName') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  hideAddForm(): void {
    console.log('[ORG DROPDOWN] Hiding add form');
    this.showingAddForm = false;
    this.newOrgName = '';
  }

  createOrganization(): void {
    if (!this.newOrgName.trim()) {
      return;
    }

    console.log('[ORG DROPDOWN] Creating organization:', this.newOrgName);
    this.store.dispatch(
      OrganizationActions.createOrganization({
        organization: { name: this.newOrgName.trim() },
      })
    );

    // Don't hide the form immediately - wait for success/failure
    // The form will be hidden in the success handler
  }

  trackByOrgId(index: number, org: Organization): number {
    return org.id;
  }

  private handleClickOutside(event: Event): void {
    const target = event.target as Element;
    const dropdown = target.closest('app-organization-dropdown');

    if (!dropdown && this.isOpen) {
      this.isOpen = false;
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserRole } from '../../core/auth.service';
import { ApiService, Organization } from '../../core/api.service';
import * as AuthActions from '../../state/actions/auth.actions';
import { selectUserRole } from '../../state/selectors';
import { selectCurrentOrganization } from '../../state/selectors/organization.selectors';

@Component({
  selector: 'app-role-dropdown',
  template: `
    <div class="relative">
      <div
        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
      >
        <span class="font-medium">Role:</span>
        <div class="relative">
          <select
            [ngModel]="(userRole$ | async) || 'Admin'"
            (ngModelChange)="onRoleChange($event)"
            class="custom-select appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-colors duration-200 min-w-[80px]"
          >
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Viewer">Viewer</option>
          </select>
          <!-- Custom dropdown arrow -->
          <div
            class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
          >
            <svg
              class="w-3 h-3 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: none;
      }

      /* Additional browser-specific styles to ensure no arrow appears */
      .custom-select::-ms-expand {
        display: none;
      }

      /* For older webkit browsers */
      .custom-select::-webkit-inner-spin-button,
      .custom-select::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class RoleDropdownComponent implements OnInit {
  userRole$: Observable<UserRole>;
  currentOrganization$: Observable<Organization | null>;

  // Base user IDs for each role
  private roleUserIds = {
    Owner: 0, // Owner user
    Admin: 1, // Admin user
    Viewer: 3, // Viewer user
  };

  constructor(private store: Store, private apiService: ApiService) {
    this.userRole$ = this.store.select(selectUserRole);
    this.currentOrganization$ = this.store.select(selectCurrentOrganization);
  }

  ngOnInit(): void {}

  onRoleChange(role: UserRole): void {
    console.log('Role changed to:', role);

    // Get the current organization to maintain context
    this.currentOrganization$.pipe(take(1)).subscribe((currentOrg) => {
      const currentOrgId = currentOrg?.id || 1; // Default to main org if none selected
      const userId = this.roleUserIds[role];

      try {
        // Update API service with new role and user
        this.apiService.setCurrentUserRole(role, userId);

        // The organization is already maintained by the API service
        // No need to explicitly set it since it preserves the current selection

        // Update store
        this.store.dispatch(AuthActions.setUserRole({ role }));

        console.log(
          `Switched to ${role} - User ID: ${userId}, Org: ${currentOrgId} (${currentOrg?.name})`
        );
      } catch (error) {
        console.error('Error switching role:', error);
        // Could show a notification to user here
      }
    });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, BehaviorSubject, of } from 'rxjs';
import {
  map,
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';
import { ApiService, AuditLog } from '../../core/api.service';
import { selectIsOwnerOrAdmin, selectUserRole } from '../../state/selectors';
import { UserRole } from '../../core/auth.service';

interface AuditLogDisplay extends AuditLog {
  userName?: string;
  userEmail?: string;
  actionClass: string;
  timeAgo: string;
}

@Component({
  selector: 'app-audit-log',
  template: `
    <div class="p-2 sm:p-4 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4 sm:mb-6">
        <h1
          class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Audit Log
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Track all system activities and changes
          <span
            *ngIf="(userRole$ | async) === 'Owner'"
            class="text-blue-600 dark:text-blue-400"
          >
            • Owner System-Wide View
          </span>
          <span
            *ngIf="(userRole$ | async) === 'Admin'"
            class="text-green-600 dark:text-green-400"
          >
            • Admin Organization View
          </span>
        </p>
      </div>

      <!-- Access Denied for Viewers -->
      <div
        *ngIf="!(isOwnerOrAdmin$ | async)"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6"
      >
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-red-400 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <div>
            <h3 class="text-red-800 dark:text-red-200 font-medium">
              Access Denied
            </h3>
            <p class="text-red-700 dark:text-red-300 text-sm mt-1">
              Only Owners and Admins can view audit logs.
            </p>
          </div>
        </div>
      </div>

      <!-- Audit Log Content -->
      <div *ngIf="isOwnerOrAdmin$ | async">
        <!-- Filters and Search -->
        <div
          class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 mb-6"
        >
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            <!-- Search -->
            <div class="md:col-span-2 xl:col-span-2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Search
              </label>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search by user, action, or details..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            <!-- Action Filter -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Action
              </label>
              <div class="relative">
                <select
                  [(ngModel)]="selectedAction"
                  (ngModelChange)="onActionFilterChange($event)"
                  class="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm custom-select"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                </select>
                <div
                  class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                >
                  <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Date Range -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Date Range
              </label>
              <div class="relative">
                <select
                  [(ngModel)]="selectedDateRange"
                  (ngModelChange)="onDateRangeFilterChange($event)"
                  class="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm custom-select"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <div
                  class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                >
                  <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Custom Date Range -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Custom Range
              </label>
              <div class="space-y-2">
                <input
                  type="date"
                  [(ngModel)]="customStartDate"
                  (ngModelChange)="onCustomDateChange()"
                  placeholder="Start date"
                  class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-xs"
                />
                <input
                  type="date"
                  [(ngModel)]="customEndDate"
                  (ngModelChange)="onCustomDateChange()"
                  placeholder="End date"
                  class="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-xs"
                />
              </div>
            </div>

            <!-- Organization Filter (Owner only) -->
            <div *ngIf="(userRole$ | async) === 'Owner'">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Organization
              </label>
              <div class="relative">
                <select
                  [(ngModel)]="selectedOrganization"
                  (ngModelChange)="onOrganizationFilterChange($event)"
                  class="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm custom-select"
                >
                  <option value="">All Organizations</option>
                  <option
                    *ngFor="let org of availableOrganizations$ | async"
                    [value]="org"
                  >
                    {{ org }}
                  </option>
                </select>
                <div
                  class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                >
                  <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Summary -->
        <div class="flex justify-between items-center mb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Showing {{ (filteredLogs$ | async)?.length || 0 }} of
            {{ (auditLogs$ | async)?.length || 0 }} entries
          </p>
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-600 dark:text-gray-400"
              >Sort by:</label
            >
            <div class="relative">
              <select
                [(ngModel)]="sortBy"
                (ngModelChange)="onSortChange($event)"
                class="px-3 py-1 pr-8 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white custom-select"
              >
                <option value="timestamp">Newest First</option>
                <option value="-timestamp">Oldest First</option>
                <option value="action">Action</option>
                <option value="userName">User Name</option>
              </select>
              <div
                class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
              >
                <svg
                  class="w-3 h-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Audit Log Table -->
        <div
          class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
        >
          <div *ngIf="loading" class="p-8 text-center">
            <div class="inline-flex items-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading audit logs...
            </div>
          </div>

          <div
            *ngIf="!loading && (filteredLogs$ | async)?.length === 0"
            class="p-8 text-center text-gray-500 dark:text-gray-400"
          >
            <svg
              class="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No audit logs found</p>
            <p class="text-sm">Try adjusting your filters or search terms</p>
          </div>

          <div
            *ngIf="!loading && (filteredLogs$ | async)?.length"
            class="overflow-x-auto"
          >
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Action
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Details
                  </th>
                  <th
                    *ngIf="(userRole$ | async) === 'Owner'"
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Organization
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Task ID
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr
                  *ngFor="
                    let log of filteredLogs$ | async;
                    trackBy: trackByLogId
                  "
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <!-- User -->
                  <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8">
                        <div
                          class="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium"
                        >
                          {{ getInitials(log.userName || 'Unknown') }}
                        </div>
                      </div>
                      <div class="ml-3">
                        <div
                          class="text-sm font-medium text-gray-900 dark:text-white"
                        >
                          {{ log.userName || 'Unknown User' }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          ID: {{ log.userId }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Action -->
                  <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span [class]="log.actionClass">
                      {{ log.action }}
                    </span>
                  </td>

                  <!-- Details -->
                  <td class="px-4 sm:px-6 py-4">
                    <div
                      class="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                      [title]="log.details"
                    >
                      {{ log.details }}
                    </div>
                  </td>

                  <!-- Organization (Owner only) -->
                  <td
                    *ngIf="(userRole$ | async) === 'Owner'"
                    class="px-4 sm:px-6 py-4 whitespace-nowrap"
                  >
                    <div class="text-sm text-gray-900 dark:text-white">
                      {{ log.organizationName || 'Unknown Org' }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      ID: {{ log.organizationId }}
                    </div>
                  </td>

                  <!-- Task ID -->
                  <td
                    class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span
                      *ngIf="log.taskId"
                      class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs"
                    >
                      #{{ log.taskId }}
                    </span>
                    <span *ngIf="!log.taskId" class="text-gray-400">-</span>
                  </td>

                  <!-- Time -->
                  <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white">
                      {{ log.timeAgo }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ log.timestamp | date : 'short' }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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

      /* Remove default arrows in all browsers */
      .custom-select::-ms-expand {
        display: none;
      }

      .custom-select::-webkit-inner-spin-button,
      .custom-select::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Firefox */
      .custom-select {
        -moz-appearance: textfield;
      }

      /* Additional reset for Safari */
      .custom-select:focus {
        background-image: none;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
})
export class AuditLogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');
  private actionFilterSubject = new BehaviorSubject<string>('');
  private dateRangeFilterSubject = new BehaviorSubject<string>('');
  private customDateRangeSubject = new BehaviorSubject<{
    startDate: string;
    endDate: string;
  }>({ startDate: '', endDate: '' });
  private organizationFilterSubject = new BehaviorSubject<string>('');
  private sortSubject = new BehaviorSubject<string>('timestamp');

  auditLogs$: Observable<AuditLog[]>;
  filteredLogs$: Observable<AuditLogDisplay[]>;
  isOwnerOrAdmin$: Observable<boolean>;
  userRole$: Observable<UserRole>;
  availableOrganizations$: Observable<string[]>;

  searchTerm = '';
  selectedAction = '';
  selectedDateRange = '';
  customStartDate = '';
  customEndDate = '';
  selectedOrganization = '';
  sortBy = 'timestamp';
  loading = true;

  constructor(private apiService: ApiService, private store: Store) {
    this.isOwnerOrAdmin$ = this.store.select(selectIsOwnerOrAdmin);
    this.userRole$ = this.store.select(selectUserRole);

    // Load audit logs based on user role
    this.auditLogs$ = this.userRole$.pipe(
      switchMap((role) => {
        if (role === 'Owner') {
          return this.apiService.getAllAuditLogs();
        } else if (role === 'Admin') {
          return this.apiService.getAuditLogs();
        }
        return of([]);
      })
    );

    // Get available organizations for Owner filter
    this.availableOrganizations$ = this.auditLogs$.pipe(
      map((logs) => {
        if (!Array.isArray(logs)) return [];
        const organizations = [
          ...new Set(
            logs
              .map((log) => log.organizationName)
              .filter((name): name is string => Boolean(name))
          ),
        ];
        return organizations.sort();
      })
    );

    // Enhanced filtering and processing with proper reactive streams
    this.filteredLogs$ = combineLatest([
      this.auditLogs$,
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      ),
      this.actionFilterSubject.pipe(distinctUntilChanged(), startWith('')),
      this.dateRangeFilterSubject.pipe(distinctUntilChanged(), startWith('')),
      this.customDateRangeSubject.pipe(
        distinctUntilChanged(),
        startWith({ startDate: '', endDate: '' })
      ),
      this.organizationFilterSubject.pipe(
        distinctUntilChanged(),
        startWith('')
      ),
      this.sortSubject.pipe(distinctUntilChanged(), startWith('timestamp')),
    ]).pipe(
      map(
        ([
          logs,
          searchTerm,
          actionFilter,
          dateRangeFilter,
          customDateRange,
          organizationFilter,
          sortBy,
        ]) => {
          if (!Array.isArray(logs)) return [];

          let filtered = logs.map((log) => this.enhanceAuditLog(log));

          // Apply search filter
          if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(
              (log) =>
                log.userName?.toLowerCase().includes(search) ||
                log.userEmail?.toLowerCase().includes(search) ||
                log.action.toLowerCase().includes(search) ||
                log.details.toLowerCase().includes(search)
            );
          }

          // Apply action filter
          if (actionFilter) {
            filtered = filtered.filter((log) => log.action === actionFilter);
          }

          // Apply organization filter
          if (organizationFilter) {
            filtered = filtered.filter(
              (log) => log.organizationName === organizationFilter
            );
          }

          // Apply date range filter (either dropdown or custom)
          if (customDateRange.startDate || customDateRange.endDate) {
            // Use custom date range
            const startDate = customDateRange.startDate
              ? new Date(customDateRange.startDate)
              : new Date(0);
            const endDate = customDateRange.endDate
              ? new Date(customDateRange.endDate)
              : new Date();

            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);

            filtered = filtered.filter((log) => {
              const logDate = new Date(log.timestamp);
              return logDate >= startDate && logDate <= endDate;
            });
          } else if (dateRangeFilter) {
            // Use dropdown selection
            const now = new Date();
            let cutoffDate = new Date();

            switch (dateRangeFilter) {
              case 'today':
                cutoffDate.setHours(0, 0, 0, 0);
                break;
              case 'week':
                cutoffDate.setDate(now.getDate() - 7);
                break;
              case 'month':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            }

            filtered = filtered.filter(
              (log) => new Date(log.timestamp) >= cutoffDate
            );
          }

          // Apply sorting
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'timestamp':
                return (
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
                );
              case '-timestamp':
                return (
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
                );
              case 'action':
                return a.action.localeCompare(b.action);
              case 'userName':
                return (a.userName || '').localeCompare(b.userName || '');
              default:
                return 0;
            }
          });

          return filtered;
        }
      )
    );
  }

  ngOnInit(): void {
    // Load data if user has permission
    this.isOwnerOrAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe((canAccess) => {
        if (canAccess) {
          this.loadAuditLogs();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAuditLogs(): void {
    this.loading = true;

    this.auditLogs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.loading = false;
      },
    });
  }

  private enhanceAuditLog(log: AuditLog): AuditLogDisplay {
    const userInfo = this.apiService.getUserInfo(log.userId);

    return {
      ...log,
      userName: userInfo?.name || `User ${log.userId}`,
      userEmail: userInfo?.email || '',
      actionClass: this.getActionClass(log.action),
      timeAgo: this.getTimeAgo(log.timestamp),
    };
  }

  private getActionClass(action: string): string {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (action) {
      case 'CREATE':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'UPDATE':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'DELETE':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  onActionFilterChange(action: string): void {
    this.selectedAction = action;
    this.actionFilterSubject.next(action);
  }

  onDateRangeFilterChange(dateRange: string): void {
    this.selectedDateRange = dateRange;
    this.dateRangeFilterSubject.next(dateRange);

    // Clear custom dates when using dropdown
    if (dateRange) {
      this.customStartDate = '';
      this.customEndDate = '';
      this.customDateRangeSubject.next({ startDate: '', endDate: '' });
    }
  }

  onCustomDateChange(): void {
    this.customDateRangeSubject.next({
      startDate: this.customStartDate,
      endDate: this.customEndDate,
    });

    // Clear dropdown selection when using custom dates
    if (this.customStartDate || this.customEndDate) {
      this.selectedDateRange = '';
      this.dateRangeFilterSubject.next('');
    }
  }

  onOrganizationFilterChange(organization: string): void {
    this.selectedOrganization = organization;
    this.organizationFilterSubject.next(organization);
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.sortSubject.next(sortBy);
  }

  trackByLogId(index: number, log: AuditLogDisplay): number {
    return log.id;
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map, startWith, take, tap } from 'rxjs/operators';
import { Task, TaskCategory, Organization } from '../../core/api.service';
import { KeyboardShortcutsService } from '../../core/keyboard-shortcuts.service';
import * as TaskActions from '../../state/actions/task.actions';
import {
  selectAllTasks,
  selectLoading,
  selectIsOwnerOrAdmin,
  selectError,
  selectUserRole,
} from '../../state/selectors';
import {
  selectOrganizations,
  selectCurrentOrganization,
} from '../../state/selectors/organization.selectors';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { DeleteConfirmationDialogComponent } from '../../shared/components/delete-confirmation-dialog.component';
import { QuickDeleteWarningDialogComponent } from '../../shared/components/quick-delete-warning-dialog.component';
import { TaskCreationDialogComponent } from '../../shared/components/task-creation-dialog.component';
import { TaskEditDialogComponent } from '../../shared/components/task-edit-dialog.component';
import { formatTaskStatus } from '../../shared/utils/status-formatter.util';

@Component({
  selector: 'app-task-list',
  template: `
    <div class="p-2 sm:p-4">
      <div class="flex flex-col gap-4 mb-6">
        <div
          class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
        >
          <h1 class="text-xl sm:text-2xl font-bold dark:text-white">Tasks</h1>
          <button
            *ngIf="isOwnerOrAdmin$ | async"
            class="btn btn-primary w-full sm:w-auto"
            (click)="onCreateTask()"
          >
            Create Task
          </button>
        </div>

        <!-- Filters Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
          <div class="flex flex-col gap-3">
            <!-- Search and Filters Row 1 -->
            <div class="flex flex-col sm:flex-row gap-3">
              <input
                #searchInput
                type="text"
                [formControl]="searchControl"
                placeholder="Search tasks..."
                class="form-input flex-1 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <div class="flex gap-2">
                <!-- Organization Filter (only for cross-org users) -->
                <select
                  *ngIf="showCrossOrgFeatures$ | async"
                  #organizationSelect
                  [formControl]="organizationFilter"
                  class="form-input flex-1 sm:w-52 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 pr-8"
                >
                  <option value="">All Organizations</option>
                  <option
                    *ngFor="let org of organizations$ | async"
                    [value]="org.id"
                  >
                    {{ org.name }}
                  </option>
                </select>
                <select
                  #categorySelect
                  [formControl]="categoryFilter"
                  class="form-input flex-1 sm:w-36 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">All Categories</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  #statusSelect
                  [formControl]="statusFilter"
                  class="form-input flex-1 sm:w-32 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">All Status</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>

            <!-- Quick Delete Toggle Row -->
            <div
              *ngIf="isOwnerOrAdmin$ | async"
              class="flex justify-center sm:justify-start"
            >
              <label
                class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <div
                  class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in"
                >
                  <input
                    type="checkbox"
                    [checked]="quickDeleteEnabled"
                    (click)="onQuickDeleteToggle($event)"
                    class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label
                    class="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer"
                    [class.bg-orange-400]="quickDeleteEnabled"
                    [class.bg-gray-300]="!quickDeleteEnabled"
                    [class.dark:bg-gray-600]="!quickDeleteEnabled"
                  ></label>
                </div>
                <span class="flex items-center gap-1">
                  <svg
                    class="w-4 h-4 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Quick Delete
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        *ngIf="error$ | async as error"
        class="mb-4 p-3 sm:p-4 bg-red-100 text-red-700 rounded-lg text-sm"
      >
        {{ error }}
      </div>

      <!-- Task Completion Progress -->
      <div class="mb-6 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Task Progress
        </h3>
        <div
          class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-green-500 transition-all duration-500"
            [style.width.%]="completionPercentage$ | async"
          ></div>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ completedTasks$ | async }} of {{ totalTasks$ | async }} tasks
          completed
        </div>
      </div>

      <div *ngIf="loading$ | async" class="flex justify-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>

      <div
        *ngIf="!(loading$ | async) && (tasks$ | async)?.length === 0"
        class="text-center text-gray-500 dark:text-gray-400 py-8"
      >
        No tasks found. Click "Create Task" to add one.
      </div>

      <div
        *ngIf="!(loading$ | async) && ((tasks$ | async)?.length ?? 0) > 0"
        cdkDropList
        (cdkDropListDropped)="onDrop($event)"
        class="grid gap-3 sm:gap-4"
      >
        <div
          *ngFor="let task of filteredTasks$ | async; let i = index"
          cdkDrag
          class="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow cursor-move"
          [class.border-l-4]="true"
          [class.border-yellow-500]="task.status === 'TODO'"
          [class.border-blue-500]="task.status === 'IN_PROGRESS'"
          [class.border-green-500]="task.status === 'DONE'"
          [class.ring-2]="selectedTaskIndex === i"
          [class.ring-blue-500]="selectedTaskIndex === i"
          [class.ring-opacity-50]="selectedTaskIndex === i"
        >
          <div
            class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h3
                  class="text-base sm:text-lg font-semibold dark:text-white break-words"
                >
                  {{ task.title }}
                </h3>
                <div class="flex gap-2 flex-wrap">
                  <!-- Organization badge (only for cross-org users) -->
                  <span
                    *ngIf="(showCrossOrgFeatures$ | async) && task.organization"
                    class="px-2 py-1 text-xs rounded-full font-medium"
                    [class]="getOrganizationBadgeColor(task.organization.id)"
                  >
                    {{ task.organization.name }}
                  </span>
                  <span
                    class="px-2 py-1 text-xs rounded-full self-start"
                    [class.bg-purple-100]="task.category === 'Work'"
                    [class.bg-orange-100]="task.category === 'Personal'"
                    [class.bg-blue-100]="task.category === 'Shopping'"
                    [class.bg-green-100]="task.category === 'Health'"
                    [class.bg-gray-100]="task.category === 'Other'"
                  >
                    {{ task.category }}
                  </span>
                </div>
              </div>
              <p
                class="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-2 break-words"
              >
                {{ task.description }}
              </p>
              <span
                class="inline-block px-2 py-1 text-xs sm:text-sm rounded-full"
                [class.bg-yellow-100]="task.status === 'TODO'"
                [class.bg-blue-100]="task.status === 'IN_PROGRESS'"
                [class.bg-green-100]="task.status === 'DONE'"
              >
                {{ formatTaskStatus(task.status) }}
              </span>
            </div>

            <div
              *ngIf="isOwnerOrAdmin$ | async"
              class="flex flex-row sm:flex-col lg:flex-row gap-2 sm:flex-shrink-0"
            >
              <button
                class="btn btn-primary text-sm flex-1 sm:flex-none min-h-[40px] px-3 py-2"
                (click)="onEditTask(task)"
              >
                Edit
              </button>
              <button
                class="btn btn-danger text-sm flex-1 sm:flex-none flex items-center justify-center gap-1 min-h-[40px] px-3 py-2"
                (click)="onDeleteTask(task)"
                [title]="
                  quickDeleteEnabled
                    ? 'Delete immediately (Quick Delete enabled)'
                    : 'Delete with confirmation'
                "
              >
                <span>Delete</span>
                <svg
                  *ngIf="quickDeleteEnabled"
                  class="w-3 h-3 text-orange-300 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <app-delete-confirmation-dialog
        [isOpen]="showDeleteDialog"
        [taskTitle]="taskToDelete?.title || ''"
        [taskStatus]="taskToDelete?.status || 'TODO'"
        (confirm)="onConfirmDelete()"
        (cancel)="onCancelDelete()"
      ></app-delete-confirmation-dialog>

      <!-- Quick Delete Warning Dialog -->
      <app-quick-delete-warning-dialog
        [isOpen]="showQuickDeleteWarning"
        (confirm)="onConfirmQuickDeleteWarning()"
        (cancel)="onCancelQuickDeleteWarning()"
      ></app-quick-delete-warning-dialog>

      <!-- Task Creation Dialog -->
      <app-task-creation-dialog
        [isOpen]="showCreateTaskDialog"
        [showCrossOrgFeatures]="(showCrossOrgFeatures$ | async) ?? false"
        [organizations]="(organizations$ | async) ?? []"
        [currentOrganizationId]="(currentOrganization$ | async)?.id || 1"
        (confirm)="onConfirmCreateTask($event)"
        (cancel)="onCancelCreateTask()"
      ></app-task-creation-dialog>

      <!-- Task Edit Dialog -->
      <app-task-edit-dialog
        [isOpen]="showEditTaskDialog"
        [task]="taskToEdit"
        [showCrossOrgFeatures]="(showCrossOrgFeatures$ | async) ?? false"
        [organizations]="(organizations$ | async) ?? []"
        (confirm)="onConfirmEditTask($event)"
        (cancel)="onCancelEditTask()"
      ></app-task-edit-dialog>
    </div>
  `,
  styles: [
    `
      .toggle-checkbox:checked {
        right: 0;
        border-color: #f97316;
        background-color: #f97316;
      }
      .toggle-checkbox {
        transition: all 0.3s ease;
        top: 0;
        left: 0;
      }
      .toggle-checkbox:checked {
        transform: translateX(100%);
        border-color: #f97316;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    DeleteConfirmationDialogComponent,
    QuickDeleteWarningDialogComponent,
    TaskCreationDialogComponent,
    TaskEditDialogComponent,
  ],
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks$: Observable<Task[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  isOwnerOrAdmin$: Observable<boolean>;
  filteredTasks$: Observable<Task[]>;
  completionPercentage$: Observable<number>;
  completedTasks$: Observable<number>;
  totalTasks$: Observable<number>;

  // Cross-organization support
  userRole$: Observable<string>;
  currentOrganization$: Observable<Organization | null>;
  organizations$: Observable<Organization[]>;
  showCrossOrgFeatures$: Observable<boolean>;

  private subscriptions: Subscription = new Subscription();

  // Delete dialog state
  showDeleteDialog = false;
  taskToDelete: Task | null = null;

  // Quick delete state
  quickDeleteEnabled = false;
  showQuickDeleteWarning = false;

  // Task creation dialog state
  showCreateTaskDialog = false;

  // Task edit dialog state
  showEditTaskDialog = false;
  taskToEdit: Task | null = null;

  // Task selection for keyboard navigation
  selectedTaskIndex = -1;
  filteredTasksArray: Task[] = [];

  searchControl = new FormControl('');
  categoryFilter = new FormControl<TaskCategory | ''>('');
  statusFilter = new FormControl<'TODO' | 'IN_PROGRESS' | 'DONE' | ''>('');
  organizationFilter = new FormControl<number | ''>(''); // Organization filter for cross-org users

  constructor(
    private store: Store,
    private router: Router,
    private keyboardShortcutsService: KeyboardShortcutsService
  ) {
    this.tasks$ = this.store.select(selectAllTasks).pipe(
      tap((tasks) => {
        console.log('Tasks from store:', tasks);
        if (!tasks || tasks.length === 0) {
          console.log('No tasks found in store');
        }
      })
    );

    this.loading$ = this.store
      .select(selectLoading)
      .pipe(tap((loading) => console.log('Loading state:', loading)));

    this.error$ = this.store.select(selectError).pipe(
      tap((error) => {
        if (error) {
          console.error('Error from store:', error);
        }
      })
    );
    this.isOwnerOrAdmin$ = this.store.select(selectIsOwnerOrAdmin);

    // Cross-organization observables
    this.userRole$ = this.store.select(selectUserRole);
    this.currentOrganization$ = this.store.select(selectCurrentOrganization);
    this.organizations$ = this.store.select(selectOrganizations);

    // Determine if user should see cross-organization features
    // Only "Owner" at parent organization (id 1 = "No Substitutions") gets cross-org access
    this.showCrossOrgFeatures$ = combineLatest([
      this.userRole$,
      this.currentOrganization$,
    ]).pipe(
      map(([role, currentOrg]) => {
        return (
          role === 'Owner' && currentOrg?.id === 1 && !currentOrg.parentOrg
        );
      })
    );

    // Set up filtered tasks with organization filtering for cross-org users
    this.filteredTasks$ = combineLatest([
      this.tasks$,
      this.searchControl.valueChanges.pipe(startWith('')),
      this.categoryFilter.valueChanges.pipe(startWith('')),
      this.statusFilter.valueChanges.pipe(startWith('')),
      this.organizationFilter.valueChanges.pipe(startWith('')),
      this.showCrossOrgFeatures$,
    ]).pipe(
      map(
        ([
          tasks,
          search,
          category,
          status,
          organizationId,
          showCrossOrgFeatures,
        ]) => {
          console.log('Filtering tasks:', {
            tasks,
            search,
            category,
            status,
            organizationId,
            organizationIdType: typeof organizationId,
            showCrossOrgFeatures,
          });
          return tasks.filter((task) => {
            const matchesSearch =
              !search ||
              task.title.toLowerCase().includes(search.toLowerCase()) ||
              (task.description?.toLowerCase() || '').includes(
                search.toLowerCase()
              );
            const matchesCategory = !category || task.category === category;
            const matchesStatus = !status || task.status === status;

            // Only apply organization filtering for cross-org users
            // Convert organizationId to number for proper comparison
            const organizationIdNum = organizationId ? +organizationId : null;
            const matchesOrganization =
              !showCrossOrgFeatures ||
              !organizationIdNum ||
              task.organization?.id === organizationIdNum;

            console.log('Task filter check:', {
              taskId: task.id,
              taskTitle: task.title,
              taskOrgId: task.organization?.id,
              filterOrgId: organizationIdNum,
              matchesOrganization,
              showCrossOrgFeatures,
            });

            return (
              matchesSearch &&
              matchesCategory &&
              matchesStatus &&
              matchesOrganization
            );
          });
        }
      ),
      tap((filteredTasks) => console.log('Filtered tasks:', filteredTasks))
    );

    // Set up task completion metrics
    this.totalTasks$ = this.filteredTasks$.pipe(
      map((tasks) => tasks.length),
      tap((total) => console.log('Total tasks:', total))
    );

    this.completedTasks$ = this.filteredTasks$.pipe(
      map((tasks) => tasks.filter((t) => t.status === 'DONE').length),
      tap((completed) => console.log('Completed tasks:', completed))
    );

    this.completionPercentage$ = combineLatest([
      this.completedTasks$,
      this.totalTasks$,
    ]).pipe(
      map(([completed, total]) => (total > 0 ? (completed / total) * 100 : 0)),
      tap((percentage) => console.log('Completion percentage:', percentage))
    );
  }

  ngOnInit(): void {
    console.log('TaskListComponent initialized - Dispatching loadTasks action');
    // Load quick delete preference from localStorage
    this.loadQuickDeletePreference();

    // Subscribe to keyboard shortcuts
    this.subscriptions.add(
      this.keyboardShortcutsService.shortcut$.subscribe((action) => {
        this.handleKeyboardShortcut(action);
      })
    );

    // Subscribe to filtered tasks to maintain task array for navigation
    this.subscriptions.add(
      this.filteredTasks$.subscribe((tasks) => {
        this.filteredTasksArray = tasks;
        // Reset selection if it's out of bounds
        if (this.selectedTaskIndex >= tasks.length) {
          this.selectedTaskIndex = -1;
        }
        // Auto-select first task if none is selected and tasks are available
        if (this.selectedTaskIndex === -1 && tasks.length > 0) {
          this.selectedTaskIndex = 0;
        }
      })
    );

    // Add a small delay to ensure store is ready
    setTimeout(() => {
      this.store.dispatch(TaskActions.loadTasks());
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadQuickDeletePreference(): void {
    const saved = localStorage.getItem('quickDeleteEnabled');
    this.quickDeleteEnabled = saved === 'true';
    console.log('Loaded quick delete preference:', this.quickDeleteEnabled);
  }

  private saveQuickDeletePreference(): void {
    localStorage.setItem(
      'quickDeleteEnabled',
      this.quickDeleteEnabled.toString()
    );
    console.log('Saved quick delete preference:', this.quickDeleteEnabled);
  }

  onCreateTask(): void {
    console.log('Opening create task dialog');
    this.showCreateTaskDialog = true;
  }

  onEditTask(task: Task): void {
    console.log('Opening edit task dialog for task:', task);
    this.taskToEdit = task;
    this.showEditTaskDialog = true;
  }

  onDeleteTask(task: Task): void {
    console.log('Delete requested for task:', task);

    if (this.quickDeleteEnabled) {
      // Quick delete - delete immediately without confirmation
      console.log('Quick deleting task:', task.id);
      this.store.dispatch(TaskActions.deleteTask({ id: task.id }));
    } else {
      // Normal delete - show confirmation dialog
      console.log('Showing delete confirmation for task:', task);
      this.taskToDelete = task;
      this.showDeleteDialog = true;
    }
  }

  onQuickDeleteToggle(event: Event): void {
    if (!this.quickDeleteEnabled) {
      // Attempting to enable quick delete - prevent default and show warning first
      event.preventDefault(); // Only prevent default when showing warning
      console.log('Attempting to enable quick delete');
      this.showQuickDeleteWarning = true;
    } else {
      // Disabling quick delete - allow normal behavior, no warning needed
      console.log('Disabling quick delete');
      this.quickDeleteEnabled = false;
      this.saveQuickDeletePreference();
      // Don't prevent default here so the visual state updates
    }
  }

  onConfirmQuickDeleteWarning(): void {
    console.log('Quick delete warning confirmed');
    this.quickDeleteEnabled = true;
    this.saveQuickDeletePreference();
    this.showQuickDeleteWarning = false;
  }

  onCancelQuickDeleteWarning(): void {
    console.log('Quick delete warning cancelled');
    this.showQuickDeleteWarning = false;
    // Reset the toggle since user cancelled
    this.quickDeleteEnabled = false;
  }

  onConfirmDelete(): void {
    if (this.taskToDelete) {
      console.log('Deleting task:', this.taskToDelete.id);
      this.store.dispatch(TaskActions.deleteTask({ id: this.taskToDelete.id }));
      this.onCancelDelete(); // Close the dialog
    }
  }

  onCancelDelete(): void {
    console.log('Cancelling delete');
    this.showDeleteDialog = false;
    this.taskToDelete = null;
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    console.log('Task dropped:', event);

    // Get the current tasks array from the observable
    this.filteredTasks$.pipe(take(1)).subscribe((tasks) => {
      if (event.previousIndex !== event.currentIndex) {
        const tasksCopy = [...tasks];
        moveItemInArray(tasksCopy, event.previousIndex, event.currentIndex);

        // Update the order in the store
        this.store.dispatch(TaskActions.reorderTasks({ tasks: tasksCopy }));
        console.log('New task order dispatched:', tasksCopy);
      }
    });
  }

  onConfirmCreateTask(taskData: {
    title: string;
    description: string;
    category: TaskCategory;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    organizationId?: number;
  }): void {
    console.log('Creating new task:', taskData);
    this.store.dispatch(TaskActions.createTask({ task: taskData }));
    this.showCreateTaskDialog = false;
  }

  onCancelCreateTask(): void {
    console.log('Task creation cancelled');
    this.showCreateTaskDialog = false;
  }

  onConfirmEditTask(editData: {
    id: number;
    task: {
      title: string;
      description: string;
      category: TaskCategory;
      status: 'TODO' | 'IN_PROGRESS' | 'DONE';
      organizationId?: number;
    };
  }): void {
    console.log('Updating task:', editData);
    this.store.dispatch(TaskActions.updateTask(editData));
    this.showEditTaskDialog = false;
    this.taskToEdit = null;
  }

  onCancelEditTask(): void {
    console.log('Task edit cancelled');
    this.showEditTaskDialog = false;
    this.taskToEdit = null;
  }

  private handleKeyboardShortcut(action: string): void {
    switch (action) {
      case 'create-task':
        this.onCreateTask();
        break;
      case 'focus-search':
        this.focusSearchInput();
        break;
      case 'cycle-category-filters':
        this.cycleCategoryFilters();
        break;
      case 'cycle-status-filters':
        this.cycleStatusFilters();
        break;
      case 'toggle-quick-delete':
        this.toggleQuickDelete();
        break;
      case 'navigate-up':
        this.navigateUp();
        break;
      case 'navigate-down':
        this.navigateDown();
        break;
      case 'edit-task':
        this.editSelectedTask();
        break;
      case 'delete-task':
        this.deleteSelectedTask();
        break;
      case 'close-dialogs':
        this.closeAllDialogs();
        break;
    }
  }

  private focusSearchInput(): void {
    const searchInput = document.querySelector(
      'input[placeholder="Search tasks..."]'
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  private cycleCategoryFilters(): void {
    const categoryOptions: (TaskCategory | '')[] = [
      '',
      'Work',
      'Personal',
      'Shopping',
      'Health',
      'Other',
    ];

    const currentCategoryIndex = categoryOptions.indexOf(
      this.categoryFilter.value as TaskCategory | ''
    );
    const nextCategoryIndex =
      (currentCategoryIndex + 1) % categoryOptions.length;
    this.categoryFilter.setValue(categoryOptions[nextCategoryIndex]);
  }

  private cycleStatusFilters(): void {
    const statusOptions: ('TODO' | 'IN_PROGRESS' | 'DONE' | '')[] = [
      '',
      'TODO',
      'IN_PROGRESS',
      'DONE',
    ];

    const currentStatusIndex = statusOptions.indexOf(
      this.statusFilter.value as 'TODO' | 'IN_PROGRESS' | 'DONE' | ''
    );
    const nextStatusIndex = (currentStatusIndex + 1) % statusOptions.length;
    this.statusFilter.setValue(statusOptions[nextStatusIndex]);
  }

  private toggleQuickDelete(): void {
    if (!this.quickDeleteEnabled) {
      this.showQuickDeleteWarning = true;
    } else {
      this.quickDeleteEnabled = false;
      this.saveQuickDeletePreference();
    }
  }

  private navigateUp(): void {
    if (this.filteredTasksArray.length === 0) return;

    if (this.selectedTaskIndex <= 0) {
      this.selectedTaskIndex = this.filteredTasksArray.length - 1;
    } else {
      this.selectedTaskIndex--;
    }
    this.scrollToSelectedTask();
  }

  private navigateDown(): void {
    if (this.filteredTasksArray.length === 0) return;

    if (this.selectedTaskIndex >= this.filteredTasksArray.length - 1) {
      this.selectedTaskIndex = 0;
    } else {
      this.selectedTaskIndex++;
    }
    this.scrollToSelectedTask();
  }

  private scrollToSelectedTask(): void {
    const taskElements = document.querySelectorAll('[cdkDrag]');
    if (taskElements[this.selectedTaskIndex]) {
      taskElements[this.selectedTaskIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  private editSelectedTask(): void {
    if (
      this.selectedTaskIndex >= 0 &&
      this.selectedTaskIndex < this.filteredTasksArray.length
    ) {
      const selectedTask = this.filteredTasksArray[this.selectedTaskIndex];
      this.onEditTask(selectedTask);
    }
  }

  private deleteSelectedTask(): void {
    if (
      this.selectedTaskIndex >= 0 &&
      this.selectedTaskIndex < this.filteredTasksArray.length
    ) {
      const selectedTask = this.filteredTasksArray[this.selectedTaskIndex];
      this.onDeleteTask(selectedTask);
    }
  }

  private closeAllDialogs(): void {
    this.showDeleteDialog = false;
    this.showQuickDeleteWarning = false;
    this.showCreateTaskDialog = false;
    this.showEditTaskDialog = false;
  }

  // Utility method to format status for display
  formatTaskStatus(status: 'TODO' | 'IN_PROGRESS' | 'DONE'): string {
    return formatTaskStatus(status);
  }

  // Get organization badge color based on organization ID
  getOrganizationBadgeColor(organizationId: number): string {
    const colors = [
      'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
      'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
      'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
      'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200',
      'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
    ];

    // Use modulo to cycle through colors based on organization ID
    return colors[(organizationId - 1) % colors.length];
  }
}

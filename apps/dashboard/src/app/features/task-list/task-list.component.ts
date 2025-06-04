import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map, startWith, take, tap } from 'rxjs/operators';
import { Task, TaskCategory } from '../../core/api.service';
import * as TaskActions from '../../state/actions/task.actions';
import {
  selectAllTasks,
  selectLoading,
  selectIsOwnerOrAdmin,
  selectError,
} from '../../state/selectors';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { DeleteConfirmationDialogComponent } from '../../shared/components/delete-confirmation-dialog.component';
import { QuickDeleteWarningDialogComponent } from '../../shared/components/quick-delete-warning-dialog.component';
import { TaskCreationDialogComponent } from '../../shared/components/task-creation-dialog.component';

@Component({
  selector: 'app-task-list',
  template: `
    <div class="p-4">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
      >
        <h1 class="text-2xl font-bold dark:text-white">Tasks</h1>
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search and Filters -->
          <div class="flex gap-2">
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Search tasks..."
              class="form-input w-48 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <select
              [formControl]="categoryFilter"
              class="form-input w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">All Categories</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Shopping">Shopping</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
            <select
              [formControl]="statusFilter"
              class="form-input w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <!-- Quick Delete Toggle -->
          <div *ngIf="isOwnerOrAdmin$ | async" class="flex items-center gap-2">
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

          <button
            *ngIf="isOwnerOrAdmin$ | async"
            class="btn btn-primary"
            (click)="onCreateTask()"
          >
            Create Task
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        *ngIf="error$ | async as error"
        class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Task Completion Progress -->
      <div class="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
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
        class="grid gap-4"
      >
        <div
          *ngFor="let task of filteredTasks$ | async"
          cdkDrag
          class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow cursor-move"
          [class.border-l-4]="true"
          [class.border-yellow-500]="task.status === 'TODO'"
          [class.border-blue-500]="task.status === 'IN_PROGRESS'"
          [class.border-green-500]="task.status === 'DONE'"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold dark:text-white">
                  {{ task.title }}
                </h3>
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  [class.bg-purple-100]="task.category === 'Work'"
                  [class.bg-orange-100]="task.category === 'Personal'"
                  [class.bg-blue-100]="task.category === 'Shopping'"
                  [class.bg-green-100]="task.category === 'Health'"
                  [class.bg-gray-100]="task.category === 'Other'"
                >
                  {{ task.category }}
                </span>
              </div>
              <p class="text-gray-600 dark:text-gray-300 mt-1">
                {{ task.description }}
              </p>
              <span
                class="inline-block mt-2 px-2 py-1 text-sm rounded-full"
                [class.bg-yellow-100]="task.status === 'TODO'"
                [class.bg-blue-100]="task.status === 'IN_PROGRESS'"
                [class.bg-green-100]="task.status === 'DONE'"
              >
                {{ task.status }}
              </span>
            </div>

            <div *ngIf="isOwnerOrAdmin$ | async" class="flex gap-2">
              <button
                class="btn btn-primary text-sm"
                (click)="onEditTask(task.id)"
              >
                Edit
              </button>
              <button
                class="btn btn-danger text-sm flex items-center gap-1 min-w-fit whitespace-nowrap"
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
        (confirm)="onConfirmCreateTask($event)"
        (cancel)="onCancelCreateTask()"
      ></app-task-creation-dialog>
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
  private subscriptions: Subscription = new Subscription();

  // Delete dialog state
  showDeleteDialog = false;
  taskToDelete: Task | null = null;

  // Quick delete state
  quickDeleteEnabled = false;
  showQuickDeleteWarning = false;

  // Task creation dialog state
  showCreateTaskDialog = false;

  searchControl = new FormControl('');
  categoryFilter = new FormControl<TaskCategory | ''>('');
  statusFilter = new FormControl<'TODO' | 'IN_PROGRESS' | 'DONE' | ''>('');

  constructor(private store: Store, private router: Router) {
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

    // Set up filtered tasks
    this.filteredTasks$ = combineLatest([
      this.tasks$,
      this.searchControl.valueChanges.pipe(startWith('')),
      this.categoryFilter.valueChanges.pipe(startWith('')),
      this.statusFilter.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([tasks, search, category, status]) => {
        console.log('Filtering tasks:', { tasks, search, category, status });
        return tasks.filter((task) => {
          const matchesSearch =
            !search ||
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description?.toLowerCase() || '').includes(
              search.toLowerCase()
            );
          const matchesCategory = !category || task.category === category;
          const matchesStatus = !status || task.status === status;
          return matchesSearch && matchesCategory && matchesStatus;
        });
      }),
      tap((filteredTasks) => console.log('Filtered tasks:', filteredTasks))
    );

    // Set up task completion metrics
    this.totalTasks$ = this.tasks$.pipe(
      map((tasks) => tasks.length),
      tap((total) => console.log('Total tasks:', total))
    );

    this.completedTasks$ = this.tasks$.pipe(
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

  onEditTask(id: number): void {
    console.log('Navigating to edit task:', id);
    this.router.navigate([`/tasks/${id}/edit`]);
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
      if (tasks && tasks.length > 0) {
        // Create a copy of the tasks array
        const reorderedTasks = [...tasks];

        // Move the item to its new position
        moveItemInArray(
          reorderedTasks,
          event.previousIndex,
          event.currentIndex
        );

        console.log('Reordered tasks:', reorderedTasks);

        // Dispatch the reorder action to update the state
        this.store.dispatch(
          TaskActions.reorderTasks({ tasks: reorderedTasks })
        );
      }
    });
  }

  onConfirmCreateTask(taskData: {
    title: string;
    description: string;
    category: TaskCategory;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }): void {
    console.log('Creating new task:', taskData);
    this.store.dispatch(TaskActions.createTask({ task: taskData }));
    this.showCreateTaskDialog = false;
  }

  onCancelCreateTask(): void {
    console.log('Task creation cancelled');
    this.showCreateTaskDialog = false;
  }
}

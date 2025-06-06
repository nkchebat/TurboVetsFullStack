import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, filter, take } from 'rxjs';
import { Task } from '../../core/api.service';
import * as TaskActions from '../../state/actions/task.actions';
import { selectAllTasks, selectLoading } from '../../state/selectors';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { formatTaskStatus } from '../../shared/utils/status-formatter.util';

@Component({
  selector: 'app-task-form',
  template: `
    <div class="p-4 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">
        {{ isEditMode ? 'Edit' : 'Create' }} Task
      </h1>

      <!-- Loading indicator -->
      <div *ngIf="isLoading" class="flex justify-center mb-4">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>

      <!-- Error message -->
      <div
        *ngIf="errorMessage"
        class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg"
      >
        {{ errorMessage }}
      </div>

      <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="form-label" for="title">Title</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            class="form-input dark:bg-gray-700 dark:text-white dark:border-gray-600"
            [class.border-red-500]="
              taskForm.get('title')?.invalid && taskForm.get('title')?.touched
            "
          />
          <div
            *ngIf="
              taskForm.get('title')?.invalid && taskForm.get('title')?.touched
            "
            class="text-red-500 text-sm mt-1"
          >
            Title is required
          </div>
        </div>

        <div>
          <label class="form-label" for="description">Description</label>
          <textarea
            id="description"
            formControlName="description"
            class="form-input dark:bg-gray-700 dark:text-white dark:border-gray-600"
            rows="3"
          ></textarea>
        </div>

        <div>
          <label class="form-label" for="category">Category</label>
          <select
            id="category"
            formControlName="category"
            class="form-input dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Shopping">Shopping</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label class="form-label" for="status">Status</label>
          <select
            id="status"
            formControlName="status"
            class="form-input dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="TODO">{{ formatTaskStatus('TODO') }}</option>
            <option value="IN_PROGRESS">
              {{ formatTaskStatus('IN_PROGRESS') }}
            </option>
            <option value="DONE">{{ formatTaskStatus('DONE') }}</option>
          </select>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="taskForm.invalid || isLoading"
          >
            {{ isEditMode ? 'Update' : 'Create' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class TaskFormComponent implements OnInit, OnDestroy {
  taskForm: FormGroup;
  isEditMode = false;
  taskId?: number;
  isLoading = false;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['TODO'],
      category: ['Work'],
    });
  }

  ngOnInit(): void {
    console.log('[TASK FORM] Component initialized');

    // Check if we're editing an existing task
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.taskId = +params['id'];
        console.log('[TASK FORM] Edit mode enabled for task ID:', this.taskId);
        this.loadTaskForEditing();
      } else {
        console.log('[TASK FORM] Create mode');
      }
    });
  }

  ngOnDestroy(): void {
    console.log('[TASK FORM] Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTaskForEditing(): void {
    console.log('[TASK FORM] Loading task for editing:', this.taskId);
    this.isLoading = true;
    this.errorMessage = null;

    // First, ensure tasks are loaded in the store
    this.store.dispatch(TaskActions.loadTasks());

    // Wait for tasks to be loaded, then find the specific task
    this.store
      .select(selectLoading)
      .pipe(
        filter((loading) => !loading), // Wait until loading is false
        take(1), // Take only the first emission after loading is complete
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log('[TASK FORM] Tasks loading completed, searching for task');

        this.store
          .select(selectAllTasks)
          .pipe(take(1), takeUntil(this.destroy$))
          .subscribe((tasks) => {
            console.log('[TASK FORM] Available tasks:', tasks);
            const task = tasks.find((t: Task) => t.id === this.taskId);

            if (task) {
              console.log('[TASK FORM] Found task for editing:', task);
              this.taskForm.patchValue({
                title: task.title,
                description: task.description,
                status: task.status,
                category: task.category,
              });
              this.isLoading = false;
            } else {
              console.error('[TASK FORM] Task not found:', this.taskId);
              this.errorMessage =
                'Task not found. It may have been deleted or you may not have permission to edit it.';
              this.isLoading = false;
            }
          });
      });
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formData = this.taskForm.value;
      console.log('[TASK FORM] Form submitted with data:', formData);

      if (this.isEditMode && this.taskId) {
        console.log('[TASK FORM] Updating existing task');
        this.store.dispatch(
          TaskActions.updateTask({
            id: this.taskId,
            task: formData,
          })
        );
      } else {
        console.log('[TASK FORM] Creating new task');
        this.store.dispatch(TaskActions.createTask({ task: formData }));
      }

      // Navigate back to task list
      this.router.navigate(['/dashboard/tasks']);
    } else {
      console.log('[TASK FORM] Form is invalid');
      // Mark all fields as touched to show validation errors
      Object.keys(this.taskForm.controls).forEach((key) => {
        this.taskForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    console.log('[TASK FORM] Form cancelled');
    this.router.navigate(['/dashboard/tasks']);
  }

  // Utility method to format status for display
  formatTaskStatus(status: 'TODO' | 'IN_PROGRESS' | 'DONE'): string {
    return formatTaskStatus(status);
  }
}

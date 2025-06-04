import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Task, TaskCategory } from '../../core/api.service';

@Component({
  selector: 'app-task-edit-dialog',
  template: `
    <!-- Overlay -->
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      (click)="onCancel()"
    >
      <!-- Dialog -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-200 scale-100 animate-scale-in modal-mobile"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Task
            </h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              (click)="onCancel()"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 sm:p-6">
          <form
            [formGroup]="taskForm"
            (ngSubmit)="onSubmit()"
            class="space-y-4"
          >
            <div>
              <label class="form-label text-sm" for="title">Title *</label>
              <input
                id="title"
                type="text"
                formControlName="title"
                class="form-input w-full text-sm sm:text-base dark:bg-gray-700 dark:text-white dark:border-gray-600"
                [class.border-red-500]="
                  taskForm.get('title')?.invalid &&
                  taskForm.get('title')?.touched
                "
                placeholder="Enter task title..."
              />
              <div
                *ngIf="
                  taskForm.get('title')?.invalid &&
                  taskForm.get('title')?.touched
                "
                class="text-red-500 text-sm mt-1"
              >
                Title is required
              </div>
            </div>

            <div>
              <label class="form-label text-sm" for="description"
                >Description</label
              >
              <textarea
                id="description"
                formControlName="description"
                class="form-input w-full text-sm sm:text-base dark:bg-gray-700 dark:text-white dark:border-gray-600"
                rows="3"
                placeholder="Enter task description (optional)..."
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label text-sm" for="category"
                  >Category</label
                >
                <select
                  id="category"
                  formControlName="category"
                  class="form-input w-full text-sm sm:text-base dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label class="form-label text-sm" for="status">Status</label>
                <select
                  id="status"
                  formControlName="status"
                  class="form-input w-full text-sm sm:text-base dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <!-- Actions -->
        <div
          class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600"
        >
          <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              class="btn btn-secondary text-sm order-2 sm:order-1 dark:text-white"
              (click)="onCancel()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary text-sm order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="taskForm.invalid"
              (click)="onSubmit()"
            >
              Update Task
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.2s ease-out;
      }

      .animate-scale-in {
        animation: scaleIn 0.2s ease-out;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class TaskEditDialogComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() task: Task | null = null;
  @Output() confirm = new EventEmitter<{
    id: number;
    task: {
      title: string;
      description: string;
      category: TaskCategory;
      status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    };
  }>();
  @Output() cancel = new EventEmitter<void>();

  taskForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['TODO'],
      category: ['Work'],
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      event.preventDefault();
      this.onCancel();
    }
  }

  ngOnInit(): void {
    // Initialize form when dialog opens
    if (this.isOpen && this.task) {
      this.populateForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue && this.task) {
      this.populateForm();
      // Focus the title input when dialog opens
      setTimeout(() => {
        const titleInput = document.getElementById('title');
        if (titleInput) {
          titleInput.focus();
        }
      }, 100);
    } else if (changes['task'] && changes['task'].currentValue && this.isOpen) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        category: this.task.category,
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid && this.task) {
      const taskData = this.taskForm.value;
      console.log('Updating task:', taskData);
      this.confirm.emit({
        id: this.task.id,
        task: taskData,
      });
    }
  }

  onCancel(): void {
    console.log('Task edit cancelled');
    this.cancel.emit();
  }
}

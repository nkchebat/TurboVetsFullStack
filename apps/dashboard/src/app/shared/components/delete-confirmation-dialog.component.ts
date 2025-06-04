import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation-dialog',
  template: `
    <!-- Overlay -->
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      (click)="onCancel()"
    >
      <!-- Dialog -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100 animate-scale-in modal-mobile"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-4 sm:p-6 pb-3 sm:pb-4">
          <div class="flex items-center gap-3">
            <!-- Warning Icon -->
            <div class="flex-shrink-0">
              <svg
                class="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Task
              </h3>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 pb-3 sm:pb-4">
          <p
            class="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base"
          >
            Are you sure you want to delete the task<br />
            <span
              class="font-semibold text-gray-900 dark:text-white px-1 rounded"
              [class.bg-yellow-100]="taskStatus === 'TODO'"
              [class.dark:bg-yellow-900]="taskStatus === 'TODO'"
              [class.bg-blue-100]="taskStatus === 'IN_PROGRESS'"
              [class.dark:bg-blue-900]="taskStatus === 'IN_PROGRESS'"
              [class.bg-green-100]="taskStatus === 'DONE'"
              [class.dark:bg-green-900]="taskStatus === 'DONE'"
            >
              "{{ taskTitle }}"</span
            >
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <!-- Actions -->
        <div
          class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg"
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
              class="btn btn-danger text-sm order-1 sm:order-2"
              (click)="onConfirm()"
            >
              Delete Task
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
  imports: [CommonModule],
})
export class DeleteConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() taskTitle = '';
  @Input() taskStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' = 'TODO';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

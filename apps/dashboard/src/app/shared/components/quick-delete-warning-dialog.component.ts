import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quick-delete-warning-dialog',
  template: `
    <!-- Overlay -->
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
      (click)="onCancel()"
    >
      <!-- Dialog -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100 animate-scale-in"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-6 pb-4">
          <div class="flex items-center gap-3">
            <!-- Lightning Icon -->
            <div class="flex-shrink-0">
              <svg
                class="w-8 h-8 text-orange-500"
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
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Delete Enabled
              </h3>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 pb-4">
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            <span class="font-semibold text-orange-600 dark:text-orange-400"
              >Quick Delete</span
            >
            is now enabled. Tasks will be deleted immediately when you click the
            delete button.
          </p>
          <div
            class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
          >
            <p class="text-sm text-orange-800 dark:text-orange-200">
              <span class="font-medium">⚠️ Warning:</span> No confirmation
              dialog will be shown. Be careful when deleting tasks!
            </p>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">
            You can toggle this setting off at any time to restore confirmation
            dialogs.
          </p>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              (click)="onCancel()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 hover:shadow-lg"
              (click)="onConfirm()"
            >
              I Understand
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
export class QuickDeleteWarningDialogComponent {
  @Input() isOpen = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

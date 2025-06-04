import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  KeyboardShortcutsService,
  KeyboardShortcut,
} from '../../core/keyboard-shortcuts.service';

@Component({
  selector: 'app-keyboard-shortcuts-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isVisible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      (click)="onBackdropClick($event)"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2
              class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Keyboard Shortcuts
            </h2>
            <button
              (click)="close()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
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

        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <div class="grid gap-3">
            <div
              *ngFor="let shortcut of shortcuts"
              class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span class="text-gray-700 dark:text-gray-300">{{
                shortcut.description
              }}</span>
              <div class="flex items-center gap-1">
                <kbd
                  *ngFor="
                    let key of getFormattedShortcut(shortcut).split(' + ');
                    trackBy: trackByIndex
                  "
                  class="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded"
                >
                  {{ key }}
                </kbd>
                <span
                  *ngIf="getFormattedShortcut(shortcut).includes(' + ')"
                  class="text-gray-400 mx-1 text-xs"
                >
                </span>
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="flex items-start gap-2">
              <svg
                class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="font-medium mb-1">Tips:</p>
                <ul class="space-y-1 text-sm">
                  <li>
                    • Most shortcuts work when you're not typing in input fields
                  </li>
                  <li>
                    • Use
                    <kbd
                      class="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs"
                      >{{ isMac ? '⌘' : 'Ctrl' }} + K</kbd
                    >
                    to quickly open this guide
                  </li>
                  <li>
                    • Navigation shortcuts help you move through tasks without
                    using the mouse
                  </li>
                  <li>
                    • Quick delete mode must be enabled for delete shortcuts to
                    work
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <button
            (click)="close()"
            class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  `,
})
export class KeyboardShortcutsGuideComponent {
  @Input() isVisible = false;
  @Output() visibilityChange = new EventEmitter<boolean>();

  shortcuts: KeyboardShortcut[] = [];
  isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  constructor(private keyboardService: KeyboardShortcutsService) {
    this.shortcuts = this.keyboardService.getShortcuts();
  }

  close(): void {
    this.isVisible = false;
    this.visibilityChange.emit(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  getFormattedShortcut(shortcut: KeyboardShortcut): string {
    return this.keyboardService.getFormattedShortcut(shortcut);
  }

  trackByIndex(index: number): number {
    return index;
  }
}

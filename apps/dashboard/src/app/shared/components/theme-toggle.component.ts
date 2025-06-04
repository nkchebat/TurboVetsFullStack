import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      type="button"
      class="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
      (click)="toggleTheme()"
      [title]="
        (isDarkMode$ | async) ? 'Switch to light mode' : 'Switch to dark mode'
      "
    >
      <!-- Sun Icon (Click to switch to Light Mode - shows when in dark mode) -->
      <svg
        *ngIf="isDarkMode$ | async"
        class="w-5 h-5 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      <!-- Moon Icon (Click to switch to Dark Mode - shows when in light mode) -->
      <svg
        *ngIf="!(isDarkMode$ | async)"
        class="w-5 h-5 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      <!-- Loading animation overlay (optional) -->
      <div
        class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-10 transition-opacity duration-200"
      >
        <div class="w-8 h-8 rounded-full bg-current"></div>
      </div>
    </button>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  isDarkMode$: Observable<boolean>;
  private subscription = new Subscription();

  constructor(private themeService: ThemeService) {
    this.isDarkMode$ = this.themeService.isDarkMode$;
    console.log(
      'ThemeToggleComponent - ThemeService injected:',
      this.themeService
    );
  }

  ngOnInit(): void {
    console.log('ThemeToggleComponent initialized');

    // Subscribe to theme changes for debugging
    this.subscription.add(
      this.isDarkMode$.subscribe((isDark) => {
        console.log(
          'ThemeToggleComponent - Theme changed to:',
          isDark ? 'dark' : 'light'
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleTheme(): void {
    console.log('ThemeToggleComponent - Toggle clicked');
    console.log(
      'ThemeToggleComponent - Current theme before toggle:',
      this.themeService.getCurrentTheme()
    );
    this.themeService.toggleTheme();
    console.log(
      'ThemeToggleComponent - Current theme after toggle:',
      this.themeService.getCurrentTheme()
    );
  }
}

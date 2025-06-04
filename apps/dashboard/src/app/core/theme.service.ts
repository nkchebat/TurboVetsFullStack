import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkMode.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    console.log('Theme Service - Saved theme:', savedTheme);
    console.log('Theme Service - System prefers dark:', systemPrefersDark);

    const shouldUseDarkMode =
      savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    console.log('Theme Service - Should use dark mode:', shouldUseDarkMode);

    this.setDarkMode(shouldUseDarkMode);
  }

  toggleTheme(): void {
    const newMode = !this.isDarkMode.value;
    console.log(
      'Theme Service - Toggling theme to:',
      newMode ? 'dark' : 'light'
    );
    this.setDarkMode(newMode);
  }

  getCurrentTheme(): boolean {
    return this.isDarkMode.value;
  }

  private setDarkMode(isDark: boolean): void {
    console.log('Theme Service - Setting dark mode:', isDark);

    this.isDarkMode.next(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    if (isDark) {
      document.documentElement.classList.add('dark');
      console.log('Theme Service - Added dark class to documentElement');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Theme Service - Removed dark class from documentElement');
    }

    console.log(
      'Theme Service - Current classes on documentElement:',
      document.documentElement.className
    );
  }
}

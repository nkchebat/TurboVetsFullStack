import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeService } from './core/theme.service';
import { KeyboardShortcutsService } from './core/keyboard-shortcuts.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as AuthActions from './state/actions/auth.actions';
import { RoleDropdownComponent } from './shared/components/role-dropdown.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle.component';
import { OrganizationDropdownComponent } from './shared/components/organization-dropdown/organization-dropdown.component';
import { KeyboardShortcutsGuideComponent } from './shared/components/keyboard-shortcuts-guide.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RoleDropdownComponent,
    ThemeToggleComponent,
    OrganizationDropdownComponent,
    KeyboardShortcutsGuideComponent,
  ],
})
export class AppComponent implements OnInit {
  title = 'dashboard';
  showKeyboardShortcuts = false;
  isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  constructor(
    private store: Store,
    private themeService: ThemeService,
    private keyboardShortcutsService: KeyboardShortcutsService
  ) {
    console.log('AppComponent - ThemeService injected:', this.themeService);
  }

  ngOnInit() {
    console.log('AppComponent initialized');
    console.log(
      'AppComponent - Current theme:',
      this.themeService.getCurrentTheme()
    );
    this.store.dispatch(AuthActions.initializeAuth());

    // Subscribe to keyboard shortcuts
    this.keyboardShortcutsService.shortcut$.subscribe((action) => {
      this.handleKeyboardShortcut(action);
    });
  }

  private handleKeyboardShortcut(action: string): void {
    switch (action) {
      case 'show-shortcuts':
        this.showKeyboardShortcuts = true;
        break;
      case 'close-dialogs':
        this.showKeyboardShortcuts = false;
        break;
    }
  }
}

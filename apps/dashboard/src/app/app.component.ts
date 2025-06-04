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
import { ApiService } from './core/api.service';
import { selectUserRole } from './state/selectors';
import { selectCurrentOrganization } from './state/selectors/organization.selectors';
import { take, combineLatest } from 'rxjs';

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
  mobileMenuOpen = false;
  isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Base user IDs for each role
  private roleUserIds = {
    Owner: 0, // Owner user
    Admin: 1, // Admin user
    Viewer: 3, // Viewer user
  };

  constructor(
    private store: Store,
    private themeService: ThemeService,
    private keyboardShortcutsService: KeyboardShortcutsService,
    private apiService: ApiService
  ) {
    console.log('AppComponent - ThemeService injected:', this.themeService);
  }

  ngOnInit() {
    console.log('AppComponent initialized');
    console.log(
      'AppComponent - Current theme:',
      this.themeService.getCurrentTheme()
    );

    // Initialize auth state first
    this.store.dispatch(AuthActions.initializeAuth());

    // Synchronize API service role and organization with store state after initialization
    combineLatest([
      this.store.select(selectUserRole),
      this.store.select(selectCurrentOrganization),
    ])
      .pipe(take(1))
      .subscribe(([role, currentOrg]) => {
        console.log('Synchronizing API service with store state:', {
          role,
          currentOrg,
        });

        const userId = this.roleUserIds[role];
        const orgId = currentOrg?.id || 1; // Default to main org if none selected

        if (userId !== undefined) {
          this.apiService.setCurrentUserRole(role, userId);
          this.apiService.setCurrentOrganization(orgId);
          console.log(
            `API service synchronized - Role: ${role}, User ID: ${userId}, Org: ${orgId} (${
              currentOrg?.name || 'Default'
            })`
          );
        }
      });

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

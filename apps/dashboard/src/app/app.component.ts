import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeService } from './core/theme.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as AuthActions from './state/actions/auth.actions';
import { RoleDropdownComponent } from './shared/components/role-dropdown.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle.component';

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
  ],
})
export class AppComponent implements OnInit {
  title = 'dashboard';

  constructor(private store: Store, private themeService: ThemeService) {
    console.log('AppComponent - ThemeService injected:', this.themeService);
  }

  ngOnInit() {
    console.log('AppComponent initialized');
    console.log(
      'AppComponent - Current theme:',
      this.themeService.getCurrentTheme()
    );
    this.store.dispatch(AuthActions.initializeAuth());
  }
}

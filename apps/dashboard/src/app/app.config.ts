import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { taskReducer } from './state/reducers/task.reducer';
import { authReducer } from './state/reducers/auth.reducer';
import { organizationReducer } from './state/reducers/organization.reducer';
import { TaskEffects } from './state/effects/task.effects';
import { OrganizationEffects } from './state/effects/organization.effects';
import { ThemeService } from './core/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    provideStore({
      tasks: taskReducer,
      auth: authReducer,
      organization: organizationReducer,
    }),
    provideEffects([TaskEffects, OrganizationEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      connectInZone: true,
    }),
    ThemeService,
  ],
};

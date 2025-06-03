import { Route } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold">Welcome to TurboVets Dashboard</h1>
      <p class="mt-4">
        Your veterinary practice management system is ready to use.
      </p>
    </div>
  `,
})
export class HomeComponent {}

export const appRoutes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];

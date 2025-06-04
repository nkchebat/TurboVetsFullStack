import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import * as OrganizationActions from '../actions/organization.actions';
import * as TaskActions from '../actions/task.actions';

@Injectable()
export class OrganizationEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private store = inject(Store);

  constructor() {
    console.log('[ORG EFFECTS] Constructor called');
    console.log('[ORG EFFECTS] actions$ initialized:', !!this.actions$);
    console.log('[ORG EFFECTS] apiService initialized:', !!this.apiService);
  }

  loadOrganizations$ = createEffect(() => {
    console.log('[ORG EFFECTS] Creating loadOrganizations$ effect');
    return this.actions$.pipe(
      ofType(OrganizationActions.loadOrganizations),
      switchMap(() =>
        this.apiService.getOrganizations().pipe(
          map((organizations) =>
            OrganizationActions.loadOrganizationsSuccess({ organizations })
          ),
          catchError((error) =>
            of(
              OrganizationActions.loadOrganizationsFailure({
                error: error.message,
              })
            )
          )
        )
      )
    );
  });

  createOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganizationActions.createOrganization),
      switchMap(({ organization }) =>
        this.apiService.createOrganization(organization).pipe(
          map((newOrganization) =>
            OrganizationActions.createOrganizationSuccess({
              organization: newOrganization,
            })
          ),
          catchError((error) =>
            of(
              OrganizationActions.createOrganizationFailure({
                error: error.message,
              })
            )
          )
        )
      )
    )
  );

  // When organization is created successfully, automatically switch to it
  createOrganizationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganizationActions.createOrganizationSuccess),
      tap(({ organization }) => {
        console.log(
          '[ORG EFFECTS] Organization created successfully, switching to it:',
          organization
        );
      }),
      map(({ organization }) =>
        OrganizationActions.setCurrentOrganization({
          organizationId: organization.id,
        })
      )
    )
  );

  // When organization changes, update API service and reload tasks
  setCurrentOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganizationActions.setCurrentOrganization),
      tap(({ organizationId }) => {
        console.log(
          '[ORG EFFECTS] Setting current organization in API service:',
          organizationId
        );
        this.apiService.setCurrentOrganization(organizationId);
      }),
      map(() => TaskActions.loadTasks()) // Reload tasks for new organization
    )
  );
}

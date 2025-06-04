import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NxWelcomeComponent } from './nx-welcome.component';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { EffectsModule } from '@ngrx/effects';
import { ThemeService } from './core/theme.service';
import { KeyboardShortcutsService } from './core/keyboard-shortcuts.service';
import { ApiService } from './core/api.service';
import { of, Observable } from 'rxjs';
import { selectUserRole } from './state/selectors';
import { selectCurrentOrganization } from './state/selectors/organization.selectors';

describe('AppComponent', () => {
  let mockStore: MockStore;
  let mockThemeService: jest.Mocked<ThemeService>;
  let mockKeyboardShortcutsService: jest.Mocked<KeyboardShortcutsService>;
  let mockApiService: jest.Mocked<ApiService>;
  let actions$: Observable<any>;

  const initialState = {
    auth: { userRole: 'Admin', isLoggedIn: true },
    organization: {
      currentOrganization: {
        id: 1,
        name: 'Test Org',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  };

  beforeEach(async () => {
    // Create Jest mocks for services
    mockThemeService = {
      getCurrentTheme: jest.fn().mockReturnValue('light'),
      isDarkMode$: of(false),
    } as any;

    mockKeyboardShortcutsService = {
      shortcut$: of('test-action'),
      getShortcuts: jest.fn().mockReturnValue([
        {
          key: ';',
          ctrlKey: true,
          description: 'Create new task',
          action: 'create-task',
        },
        {
          key: 'f',
          ctrlKey: true,
          description: 'Focus search input',
          action: 'focus-search',
        },
      ]),
    } as any;

    mockApiService = {
      setCurrentUserRole: jest.fn(),
      setCurrentOrganization: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        NxWelcomeComponent,
        RouterModule.forRoot([]),
        EffectsModule.forRoot([]),
      ],
      providers: [
        provideMockStore({ initialState }),
        provideMockActions(() => actions$),
        { provide: ThemeService, useValue: mockThemeService },
        {
          provide: KeyboardShortcutsService,
          useValue: mockKeyboardShortcutsService,
        },
        { provide: ApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    mockStore = TestBed.inject(Store) as MockStore;
    actions$ = of(); // Initialize actions stream

    // Override selectors
    mockStore.overrideSelector(selectUserRole, 'Admin');
    mockStore.overrideSelector(selectCurrentOrganization, {
      id: 1,
      name: 'Test Org',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('TurboTask');
  });

  it(`should have as title 'dashboard'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('dashboard');
  });

  it('should initialize services on ngOnInit', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect(mockThemeService.getCurrentTheme).toHaveBeenCalled();
    expect(mockApiService.setCurrentUserRole).toHaveBeenCalledWith('Admin', 1);
    expect(mockApiService.setCurrentOrganization).toHaveBeenCalledWith(1);
  });
});

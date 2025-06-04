import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: string;
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutsService {
  private shortcutSubject = new Subject<string>();
  public shortcut$ = this.shortcutSubject.asObservable();

  private shortcuts: KeyboardShortcut[] = [
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
    {
      key: '1',
      ctrlKey: true,
      description: 'Cycle through category filters',
      action: 'cycle-category-filters',
    },
    {
      key: '2',
      ctrlKey: true,
      description: 'Cycle through status filters',
      action: 'cycle-status-filters',
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Show keyboard shortcuts guide',
      action: 'show-shortcuts',
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'Toggle quick delete mode',
      action: 'toggle-quick-delete',
    },
    {
      key: 'Escape',
      description: 'Close dialogs/modals',
      action: 'close-dialogs',
    },
    {
      key: 'ArrowUp',
      description: 'Navigate to previous task',
      action: 'navigate-up',
    },
    {
      key: 'ArrowDown',
      description: 'Navigate to next task',
      action: 'navigate-down',
    },
    {
      key: 'Enter',
      description: 'Edit selected task',
      action: 'edit-task',
    },
    {
      key: 'Delete',
      description: 'Delete selected task (quick delete mode)',
      action: 'delete-task',
    },
  ];

  constructor() {
    this.initializeGlobalKeyboardListener();
  }

  private initializeGlobalKeyboardListener(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Skip if user is typing in input fields
      if (this.isTypingInInput(event.target as Element)) {
        return;
      }

      const matchedShortcut = this.shortcuts.find((shortcut) =>
        this.matchesShortcut(event, shortcut)
      );

      if (matchedShortcut) {
        event.preventDefault();
        this.shortcutSubject.next(matchedShortcut.action);
      }
    });
  }

  private isTypingInInput(target: Element): boolean {
    const tagName = target.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      target.getAttribute('contenteditable') === 'true' ||
      (target as HTMLElement).closest('[contenteditable="true"]') !== null
    );
  }

  private matchesShortcut(
    event: KeyboardEvent,
    shortcut: KeyboardShortcut
  ): boolean {
    const ctrlOrCmd = event.ctrlKey || event.metaKey;

    return (
      event.key === shortcut.key &&
      (shortcut.ctrlKey ? ctrlOrCmd : !ctrlOrCmd) &&
      !!event.altKey === !!shortcut.altKey &&
      !!event.shiftKey === !!shortcut.shiftKey
    );
  }

  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  getFormattedShortcut(shortcut: KeyboardShortcut): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const parts: string[] = [];

    if (shortcut.ctrlKey) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.altKey) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.shiftKey) {
      parts.push('⇧');
    }

    // Format special keys
    let keyDisplay = shortcut.key;
    if (shortcut.key === 'ArrowUp') keyDisplay = '↑';
    else if (shortcut.key === 'ArrowDown') keyDisplay = '↓';
    else if (shortcut.key === 'ArrowLeft') keyDisplay = '←';
    else if (shortcut.key === 'ArrowRight') keyDisplay = '→';
    else if (shortcut.key === 'Delete') keyDisplay = 'Del';
    else if (shortcut.key === 'Escape') keyDisplay = 'Esc';

    parts.push(keyDisplay.toUpperCase());

    return parts.join(' + ');
  }
}

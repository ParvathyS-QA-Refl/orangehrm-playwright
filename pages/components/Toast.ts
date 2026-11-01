import { type Locator, type Page } from '@playwright/test';

// The small popup in the bottom-left corner ("Successfully Saved", "No Records Found", ...).
// It disappears after a few seconds, so tests should assert it right after the action.
export class Toast {
  private readonly container: Locator;

  constructor(page: Page) {
    // The toast has no role or accessible name, so we use its CSS class (documented exception)
    this.container = page.locator('.oxd-toast');
  }

  // Returns the toast that contains this text, e.g. toast.message('Successfully Saved')
  message(text: string): Locator {
    return this.container.filter({ hasText: text });
  }
}

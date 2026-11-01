import { type Locator, type Page } from '@playwright/test';

// The "Are you Sure?" popup shown before deleting a record
export class ConfirmDialog {
  readonly dialog: Locator;
  readonly yesDeleteButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    // The popup has role="dialog", so buttons are scoped to it (no clash with page buttons)
    this.dialog = page.getByRole('dialog');
    this.yesDeleteButton = this.dialog.getByRole('button', { name: 'Yes, Delete' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'No, Cancel' });
  }

  // Click "Yes, Delete"
  async confirm() {
    await this.yesDeleteButton.click();
  }
}

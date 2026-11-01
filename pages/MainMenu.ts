import { type Locator, type Page } from '@playwright/test';

// Page object for the left side menu shown after login (Admin, PIM, My Info, ...).
// Which items appear depends on the user's role, so the role tests check this menu.
export class MainMenu {
  readonly sidePanel: Locator;

  constructor(page: Page) {
    // There are two navigation areas (side panel + top bar), so we pick the side one by its name
    this.sidePanel = page.getByRole('navigation', { name: 'Sidepanel' });
  }

  // One menu link by its exact visible name, e.g. link('Admin')
  // exact: true so 'PIM' or 'Admin' can never match a longer name by accident
  link(name: string): Locator {
    return this.sidePanel.getByRole('link', { name, exact: true });
  }
}

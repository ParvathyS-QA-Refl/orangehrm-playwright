# Project: OrangeHRM Playwright Automation Assessment

## About me
- I am a beginner in automation (experienced manual tester). Explain your choices simply.
- Add short comments on each step in the code.

## Tech stack
- Playwright + TypeScript
- Page Object Model (POM)
- Target site: https://opensource-demo.orangehrmlive.com (public, shared demo)

## Coding rules
- Locators: prefer getByRole / getByLabel / getByPlaceholder; avoid XPath
- No hard waits (never use page.waitForTimeout)
- Use web-first assertions (await expect(...).toBeVisible())
- Credentials and URLs come from .env files, never hard-coded
- Every test creates its own data with unique names (e.g. Auto_John_<timestamp>) and cleans it up
- Tests must be independent and able to run in any order

## Tags
- @smoke, @regression, @admin, @ess

## Workflow
- Make small changes, one feature at a time
- After writing a test, run it and fix failures before moving on
- Ask me before installing new packages

## When a test fails
- First decide the failure type:
  - Test bug: wrong locator, wrong assertion or timing issue → fix the test
  - App bug: OrangeHRM itself is broken → do NOT work around it; report it to me
  - Flaky: passes sometimes, fails sometimes → find the root cause and tell me
- Maximum 3 fix attempts, then stop and explain what fails, why, and what you need from me
- Never hide failures by using networkidle, hard waits or a bigger global timeout
- During development, run only Chromium: npx playwright test --project=chromium
- After a fix, rerun the affected tests and show me a summary: passed / failed / skipped
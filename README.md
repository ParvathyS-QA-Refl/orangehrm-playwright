# OrangeHRM Playwright Automation

End-to-end UI automation of the **OrangeHRM employee lifecycle**: login, create, role-based access, update and delete. Tests run against the public demo at <https://opensource-demo.orangehrmlive.com>. The project uses Playwright + TypeScript with the Page Object Model, environment-based configuration, tags, HTML reports and a GitHub Actions pipeline.

**Author:** Parvathy S, Senior QA Engineer

---

## Contents

- [Requirements traceability](#requirements-traceability)
- [Test scenarios](#test-scenarios)
- [Tech stack](#tech-stack)
- [Folder structure](#folder-structure)
- [Setup](#setup)
- [Execution](#execution)
- [Reports](#reports)
- [Continuous integration (GitHub Actions)](#continuous-integration-github-actions)
- [Key design decisions](#key-design-decisions)
- [Known limitations](#known-limitations)
- [Future improvements](#future-improvements)

---

## Requirements traceability

Every item in the assessment brief, and where it is implemented.

### Part 1: Automate a complete employee lifecycle on OrangeHRM

| Requirement | Where it is implemented |
|---|---|
| Authentication | [tests/auth/login.spec.ts](tests/auth/login.spec.ts) (valid login, wrong password, empty fields, logout) · [tests/auth/env-check.spec.ts](tests/auth/env-check.spec.ts) · [tests/auth.setup.ts](tests/auth.setup.ts) (logs in once, saves the session) · [pages/LoginPage.ts](pages/LoginPage.ts), [pages/TopBar.ts](pages/TopBar.ts) |
| Employee creation | [tests/employee/add-employee.spec.ts](tests/employee/add-employee.spec.ts) (required fields only, with login details, "Required" validation, password mismatch, duplicate username) · [pages/AddEmployeePage.ts](pages/AddEmployeePage.ts) |
| Role-based validation | [tests/roles/](tests/roles/): [create-system-user.spec.ts](tests/roles/create-system-user.spec.ts) (admin creates an ESS user) · [ess-access.spec.ts](tests/roles/ess-access.spec.ts) (ESS menu hides Admin/PIM; Admin URL returns 403) · [admin-access.spec.ts](tests/roles/admin-access.spec.ts) (Admin user sees Admin menu; ESS → Admin role change) · [disabled-user.spec.ts](tests/roles/disabled-user.spec.ts) ("Account disabled") · [pages/AdminUsersPage.ts](pages/AdminUsersPage.ts), [pages/SystemUserFormPage.ts](pages/SystemUserFormPage.ts), [pages/MainMenu.ts](pages/MainMenu.ts) |
| Employee update | [tests/employee/edit-employee.spec.ts](tests/employee/edit-employee.spec.ts) (update Other Id, Marital Status, Gender; values persist after reload) · [pages/PersonalDetailsPage.ts](pages/PersonalDetailsPage.ts) |
| Employee deletion | [tests/employee/delete-employee.spec.ts](tests/employee/delete-employee.spec.ts) (delete, confirm, then search shows "No Records Found") · [pages/EmployeeListPage.ts](pages/EmployeeListPage.ts), [pages/components/ConfirmDialog.ts](pages/components/ConfirmDialog.ts) |

### Part 2: Framework Design & Engineering

| Requirement | Where it is implemented |
|---|---|
| Page Object Model (POM) | [pages/](pages/) (one class per page) · [pages/components/](pages/components/) (shared widgets: `Toast`, `ConfirmDialog`) · [fixtures/test-fixtures.ts](fixtures/test-fixtures.ts) (hands ready-made page objects to tests) |
| Clean and scalable folder structure | See [Folder structure](#folder-structure): tests grouped by feature (`auth`, `employee`, `roles`), with page objects, fixtures, data, utils and config kept apart |
| Environment-based configuration | [config/](config/) (`.env.qa`, `.env.staging`, committed template [config/.env.example](config/.env.example)) · [utils/env.ts](utils/env.ts) (picks the file from `TEST_ENV`, fails fast on missing values) · [playwright.config.ts](playwright.config.ts) (`baseURL` from env) · npm scripts `test:qa`, `test:staging` |
| Reusable utilities | [utils/env.ts](utils/env.ts) (typed config) · [utils/constants.ts](utils/constants.ts) (shared auth-file path) · [data/employee-data.ts](data/employee-data.ts) (unique test-data factories) · [fixtures/test-fixtures.ts](fixtures/test-fixtures.ts) (`createdEmployees` / `createdUsers` API setup + cleanup, `freshLogin` for a second user) |

### Part 3: Reporting & Observability

| Requirement | Where it is implemented |
|---|---|
| HTML test reports | [playwright.config.ts](playwright.config.ts) (`html` reporter) · `npm run report` · committed sample: [reports/sample-html-report/](reports/sample-html-report/) · CI artifact `playwright-report` |
| Screenshots and videos on failure | [playwright.config.ts](playwright.config.ts) (`screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'retain-on-failure'`) · `npm run demo:failure` ([tests/demo/demo-failure.spec.ts](tests/demo/demo-failure.spec.ts)) · committed sample: [reports/sample-failure-report/](reports/sample-failure-report/) · CI artifact `test-results` |
| Tagging strategy | Tags `@smoke`, `@regression`, `@admin`, `@ess` on every test · npm scripts `test:smoke`, `test:regression`, `test:admin`, `test:ess` · CI manual-run `tag` input |
| Environment-based test execution | `TEST_ENV` → `config/.env.<name>` ([utils/env.ts](utils/env.ts)) · `npm run test:qa` / `npm run test:staging` · CI manual-run `environment` input ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)) |

### Deliverables: GitHub repository

| Deliverable | Where |
|---|---|
| Source code | This repository: [tests/](tests/), [pages/](pages/), [fixtures/](fixtures/), [data/](data/), [utils/](utils/), [config/](config/) |
| Test reports | [reports/sample-html-report/](reports/sample-html-report/) (full passing run) · [reports/sample-failure-report/](reports/sample-failure-report/) (failure with screenshot, video, trace) |
| Build artifacts | GitHub Actions uploads `playwright-report` (every run) and `test-results` (on failure) with 30-day retention ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)). Example manual run (staging, `@smoke`): <https://github.com/ParvathyS-QA-Refl/orangehrm-playwright/actions/runs/41325260561> |
| README: setup, execution, key design decisions | This file: [Setup](#setup), [Execution](#execution), [Key design decisions](#key-design-decisions) |

---

## Test scenarios

18 tests, plus 1 setup step that logs in once.

| Spec | Test | Tags |
|---|---|---|
| auth/env-check | login page shows the login form | @smoke |
| auth/login | admin can log in with valid credentials | @smoke @regression @admin |
| auth/login | login fails with a wrong password | @regression |
| auth/login | login shows "Required" when both fields are empty | @regression |
| auth/login | admin can log out from the user dropdown | @regression |
| employee/add-employee | admin can create an employee with required fields only | @smoke @regression @admin |
| employee/add-employee | admin can create an employee with login details | @regression @admin |
| employee/add-employee | empty First and Last Name show "Required" | @regression @admin |
| employee/add-employee | different Password and Confirm Password show an error | @regression @admin |
| employee/add-employee | a username that already exists shows an error | @regression @admin |
| employee/edit-employee | admin can update personal details and they are saved | @regression @admin |
| employee/delete-employee | admin can delete an employee and it is no longer found | @regression @admin |
| roles/create-system-user | admin can create an ESS system user for a new employee | @regression @admin |
| roles/ess-access | ESS user sees My Info but not Admin or PIM in the main menu | @smoke @regression @ess |
| roles/ess-access | ESS user is blocked when opening an Admin page URL directly | @regression @ess |
| roles/admin-access | user with the Admin role sees the Admin menu after login | @regression @admin |
| roles/admin-access | admin changes a user role from ESS to Admin and the user then sees the Admin menu | @regression @admin |
| roles/disabled-user | a Disabled user cannot log in | @regression @ess |

**Tag meaning:** `@smoke` is a fast check of the most important paths. `@regression` is the full functional suite. `@admin` marks tests done as an admin user. `@ess` marks tests that check what an ESS (Employee Self Service) user can and cannot do. `@demo-failure` is used only by the intentional failure demo.

---

## Tech stack

| Tool | Why |
|---|---|
| [Playwright](https://playwright.dev) 1.64 (`@playwright/test`) | Test runner, browser automation, auto-waiting, web-first assertions, HTML report, trace viewer |
| TypeScript (strict mode) | Catches mistakes before the browser starts. `npm run typecheck` runs `tsc --noEmit` |
| Page Object Model + fixtures | Locators and actions in one place; tests read like manual test cases |
| dotenv | Loads `config/.env.<env>` into the config |
| cross-env | Sets `TEST_ENV` / `DEMO_FAILURE` in npm scripts so they work on Windows and Linux |
| GitHub Actions | CI on push/PR plus manual runs with environment and tag inputs |

---

## Folder structure

```text
orangehrm-playwright/
├── .github/workflows/   # CI pipeline: type check, run tests, upload report artifacts
├── config/              # Per-environment settings (.env.qa, .env.staging are git-ignored; .env.example is the template)
├── data/                # Test-data factories that create unique employees, logins and system users
├── fixtures/            # Custom Playwright fixtures: page objects, API setup + cleanup, freshLogin
├── pages/               # Page objects, one class per OrangeHRM page (Login, Add Employee, Users, ...)
│   └── components/      # Reusable UI widgets shared by many pages (Toast, ConfirmDialog)
├── reports/             # Committed sample HTML reports (passing run + intentional failure)
├── tests/               # Test specs grouped by feature; auth.setup.ts logs in once
│   ├── auth/            # Login page, login/logout, validation messages
│   ├── employee/        # Employee create, update and delete
│   ├── roles/           # Role-based access: ESS vs Admin, role change, disabled user
│   └── demo/            # Intentional failure demo (excluded from normal and CI runs)
├── utils/               # Typed env config loader and shared constants
├── playwright.config.ts # Timeouts, reporters, failure evidence, setup + chromium projects
├── tsconfig.json        # Strict TypeScript settings for the type check
└── package.json         # Dependencies and npm scripts
```

Generated folders that are **not** committed: `playwright-report/`, `test-results/`, `playwright/.auth/` (saved login session) and `node_modules/`.

---

## Setup

### Prerequisites

- **Node.js 20 or newer** (Playwright 1.64 needs ≥ 20; developed on Node 24)
- **Git**
- Internet access to `opensource-demo.orangehrmlive.com`

### Steps (PowerShell)

```powershell
# 1. Clone the repository
git clone https://github.com/ParvathyS-QA-Refl/orangehrm-playwright.git
cd orangehrm-playwright

# 2. Install the exact dependency versions from package-lock.json
npm ci

# 3. Install the Chromium browser used by the tests
npx playwright install chromium

# 4. Create the env file(s) from the template
Copy-Item config\.env.example config\.env.qa
Copy-Item config\.env.example config\.env.staging   # optional, only for staging runs
```

On macOS/Linux, step 4 is:

```bash
cp config/.env.example config/.env.qa
cp config/.env.example config/.env.staging   # optional, only for staging runs
```

Then edit `config\.env.qa` (and `config\.env.staging`) with real values:

```text
BASE_URL=https://opensource-demo.orangehrmlive.com
ADMIN_USERNAME=<admin username shown on the demo login page>
ADMIN_PASSWORD=<admin password shown on the demo login page>
```

`config/.env.*` files are git-ignored. Only `config/.env.example` (placeholders only) is committed. If a value is missing, the run stops at once with a message naming the variable and the file to fix.

---

## Execution

### npm scripts

| Command | What it does |
|---|---|
| `npm test` | All tests on the default environment (`qa`) |
| `npm run test:qa` | All tests on `qa` (`config/.env.qa`) |
| `npm run test:staging` | All tests on `staging` (`config/.env.staging`) |
| `npm run test:smoke` | Only `@smoke` tests |
| `npm run test:regression` | Only `@regression` tests |
| `npm run test:admin` | Only `@admin` tests |
| `npm run test:ess` | Only `@ess` tests |
| `npm run demo:failure` | Runs the intentional failure test to produce screenshot, video and trace |
| `npm run report` | Opens the last HTML report (`playwright-report/`) |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`), no browser needed |

### Environments

The environment is chosen with the `TEST_ENV` variable (`qa` or `staging`, default `qa`). It loads `config/.env.<TEST_ENV>`. Unknown values such as `stagin` stop the run with a clear error.

> Both `qa` and `staging` currently point to the same public demo site. The mechanism is in place for when a real staging server exists.

### Combining environment and tag

```powershell
# npm passes everything after "--" on to Playwright
npm run test:staging -- --grep "@smoke"

# Same thing, setting the variable yourself in PowerShell
$env:TEST_ENV = 'staging'; npx playwright test --grep "@smoke"
Remove-Item Env:TEST_ENV   # back to the default (qa)

# Combine tags: smoke tests that are also admin tests (regex lookahead)
npx playwright test --grep "(?=.*@smoke)(?=.*@admin)"
# Everything except ESS tests
npx playwright test --grep-invert "@ess"
```

### Running a single file or test

```powershell
npx playwright test tests/employee/delete-employee.spec.ts
npx playwright test -g "admin can delete an employee"
npx playwright test --last-failed
```

### Headed, UI and debug mode

```powershell
npx playwright test --headed      # watch the browser while tests run
npx playwright test --ui          # UI mode: pick tests, time-travel through each step
npx playwright test --debug       # step through with the Playwright Inspector
```

---

## Reports

| Report | How to open |
|---|---|
| Last local run | `npm run report` (serves `playwright-report/`) |
| Sample: full passing run | `npx playwright show-report reports/sample-html-report` |
| Sample: intentional failure (screenshot, video, trace) | `npx playwright show-report reports/sample-failure-report` |
| One trace file | `npx playwright show-trace test-results\<test-folder>\trace.zip` |
| CI run | Download the `playwright-report` artifact (see [CI](#continuous-integration-github-actions)), unzip, then `npx playwright show-report <unzipped-folder>` |

Use `show-report` instead of double-clicking `index.html`. The embedded trace viewer only works when the report is served over HTTP.

On failure Playwright keeps a **screenshot**, a **video** and a **trace** (a recording of every action, with DOM snapshots, console and network). On success nothing extra is kept, so passing runs stay small. In the HTML report, a cleanup problem shows up as a **warning annotation** on the test; see [Fixtures with API cleanup](#2-fixtures-with-api-cleanup-and-warning-annotations).

---

## Continuous integration (GitHub Actions)

Workflow: [.github/workflows/playwright.yml](.github/workflows/playwright.yml)

**Triggers**

| Trigger | What runs |
|---|---|
| Push to `main` / `master` | All tests on `qa` |
| Pull request to `main` / `master` | All tests on `qa` |
| Manual: **Run workflow** button | Your choice of environment and tag |

**Steps:** checkout → Node LTS → `npm ci` → install Chromium → **type check** → run tests → upload artifacts.

**Manual run**

1. Open the repository's **Actions** tab, then **Playwright Tests** in the left list.
2. Click **Run workflow** (top right of the runs list).
3. Choose **environment** (`qa` / `staging`) and optionally a **tag** (e.g. `@smoke`; empty = all tests).
4. Click **Run workflow**.

Example manual run (staging, `@smoke`): <https://github.com/ParvathyS-QA-Refl/orangehrm-playwright/actions/runs/41325260561>

**Required secrets** (Settings → Secrets and variables → Actions → *New repository secret*)

| Secret | Value |
|---|---|
| `ADMIN_USERNAME` | Admin username for the demo site |
| `ADMIN_PASSWORD` | Admin password for the demo site |

`BASE_URL` is public, so the workflow sets it as a plain value instead of a secret. Env files are never committed, so on CI the values come only from these variables.

**Downloading artifacts:** open the run, scroll to the **Artifacts** section at the bottom of the run summary, and download:

- `playwright-report`: HTML report, uploaded on every run (pass or fail, unless cancelled)
- `test-results`: raw traces, videos and screenshots, uploaded only when a test failed

Both are kept for 30 days.

---

## Key design decisions

### 1. POM + components

Each OrangeHRM page has one class in [pages/](pages/) that holds its locators and actions (`AddEmployeePage.fillNameAndId()`, `EmployeeListPage.searchById()`). Widgets that appear on many pages, such as the success toast and the "Are you Sure?" dialog, are small **components** in [pages/components/](pages/components/).
**Why:** a UI change is fixed in one place. Business **assertions stay in the tests**, so a test reads like a manual test case with steps and expected results, and `test.step()` makes those steps visible in the report.

### 2. Fixtures with API cleanup and warning annotations

[fixtures/test-fixtures.ts](fixtures/test-fixtures.ts) provides page objects plus two data fixtures, `createdEmployees` and `createdUsers`:

- A test registers every employee or user it creates. After the test, **pass or fail**, the fixture deletes them through OrangeHRM's REST API (`page.request` reuses the admin session).
- When a test is not about creation (edit, delete, roles), its **precondition** data is created via the API (`createViaApi`). This is fast, and the UI way is already covered by the add-employee and create-user tests.
- Users are deleted before their employees; the fixture dependency order guarantees this.
- If cleanup fails, it adds a **`warning` annotation** to the test in the HTML report instead of throwing.

**Why:** cleanup is like a postcondition that always runs. A cleanup hiccup on the shared demo should not turn a passed test red, but it must not be silent either. The delete test calls `markDeleted()` so cleanup doesn't try to delete the employee a second time.

### 3. Unique test data (and the Employee Id clash)

[data/employee-data.ts](data/employee-data.ts) builds names such as `Auto_John_<suffix>`, usernames `auto_<suffix>` and an Employee Id `<suffix>`. The suffix is a base-36 timestamp plus 2 random characters, 10 characters in total because OrangeHRM's Employee Id field allows at most 10.
**Why:** the demo is shared and tests run in parallel, so nothing may depend on existing data or on another test.
**The clash we fixed:** at first the tests kept the Employee Id that OrangeHRM pre-fills ("next free number"). Two parallel tests got the *same* pre-filled Id, and one failed with "Employee Id already exists". Now every test always types its own unique Id.

### 4. storageState for speed, fresh login where the login itself matters

- [tests/auth.setup.ts](tests/auth.setup.ts) logs in once as admin and saves the session to `playwright/.auth/admin.json` (git-ignored). The `chromium` project reuses it, so most tests skip the login screen.
- **Login/logout tests** ([tests/auth/login.spec.ts](tests/auth/login.spec.ts)) override this with an empty `storageState`. Logout in particular gets its *own* fresh login: logging out of the shared saved session could invalidate it for tests running in parallel.
- **ESS, Admin-role and disabled-user tests** use the `freshLogin` fixture. It opens a second, logged-out browser context and logs in as the test's own user, while `page` stays logged in as admin for setup and cleanup.

**Why:** fast where login is only a precondition, and real where login (or the user's role) is what is being tested.

### 5. Fail-fast environment config

[utils/env.ts](utils/env.ts) reads `TEST_ENV`, loads `config/.env.<env>`, and **throws before any test starts** if the environment name is unknown or a required variable is missing or empty. The error names the variable and the file to fix. Tests import the typed `env` object, never `process.env`.
**Why:** without this, a missing password shows up later as a confusing login failure. Real values set on the machine (CI secrets) are never overwritten by the file.

### 6. Locator strategy, with documented CSS exceptions

Order of preference: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText`. No XPath, no position-based selectors such as `nth-child`, and no `.first()` to silence strict mode. Rows are found by their unique data (for example, the cell that is exactly our Employee Id).
OrangeHRM's UI library doesn't link most labels to their inputs and gives some widgets no role or name. In those cases a stable CSS class is used, **always with a comment explaining why**:

| CSS used | Why |
|---|---|
| `.oxd-input-group` filtered by label text | Labels are not linked to inputs, so `getByLabel` fails |
| `.oxd-select-text` | Custom dropdown, not a native `<select>` |
| `.oxd-toast` | Toast has no role or accessible name |
| `.oxd-form-loader` | Wait for Personal Details to finish loading before typing |
| `button:has(.bi-trash)`, `button:has(.bi-pencil-fill)` | Icon-only buttons with no accessible name, always scoped to our row |
| `.oxd-userdropdown-tab`, `.oxd-switch-input` | No role or name on the user menu / "Create Login Details" switch |

### 7. Chromium only + low workers

Only the `chromium` project runs (Firefox/WebKit are prepared but commented out in [playwright.config.ts](playwright.config.ts)). Workers: **2 locally, 1 on CI**. Timeouts are moderately raised: 60 s per test, 10 s per assertion, 15 s per action, 30 s per navigation.
**Why:** the demo is public, shared and slow. More browsers and workers would mostly increase load and flakiness on someone else's server, without adding coverage the brief asks for. No hard waits and no `networkidle`: every wait is a web-first assertion on a visible condition.

### 8. Retries only on CI

`retries: 2` on CI, `0` locally.
**Why:** locally a failure must show immediately so the root cause gets fixed. On CI, retries are a safety net against demo-site hiccups, and Playwright still marks those tests as **flaky** in the report, so they stay visible.

### 9. Type check in CI

`npm run typecheck` (`tsc --noEmit`, strict mode) runs in CI **before** the browser tests.
**Why:** a typo or wrong type fails in seconds with a clear message, instead of after minutes of browser tests.

### 10. Intentional failure demo kept out of normal runs

[tests/demo/demo-failure.spec.ts](tests/demo/demo-failure.spec.ts) fails on purpose to show the debug evidence. `playwright.config.ts` ignores `tests/demo/` unless `DEMO_FAILURE=1`, which only `npm run demo:failure` sets.
**Why:** reviewers can see a real failure report, while `npm test` and CI stay green.

---

## Known limitations

- **Shared public demo.** Anyone can change data at any time. Tests only rely on data they create themselves, but someone could still, for example, change the admin password. The setup step then fails right away with a clear login error.
- **Slowness.** Response times vary a lot during the day. Timeouts are raised moderately and workers kept low; a very slow moment can still cause a timeout (retried on CI).
- **Data resets.** The demo is reset periodically. A reset in the middle of a run can make a test fail or make cleanup report a `warning` (the data is gone anyway).
- **One real environment.** `qa` and `staging` point to the same demo URL, so the environment switch is shown but not truly exercised against different servers.
- **Chromium only.** No cross-browser coverage yet.
- **Sample reports show the demo password.** Playwright writes typed values into step titles (`Fill "…"`), and the failure screenshot shows the login page, where the demo prints its credentials. That is acceptable here because these are the demo's public credentials. Reports from a real environment should **not** be committed.

## Future improvements

- Enable Firefox and WebKit projects, ideally against a private test environment.
- A dedicated OrangeHRM instance (e.g. Docker) with seeded data. That would allow more workers and true qa/staging separation.
- Employee search scenarios (by name, partial match, combined filters) and more Personal Details fields.
- ESLint with `eslint-plugin-playwright` and `@typescript-eslint/no-floating-promises` to catch missing `await`s.
- Scheduled nightly regression run in CI, and sharding when the suite grows.
- Optional Allure reporting (needs Java) and API-level tests for the PIM endpoints.
- Accessibility checks (e.g. `@axe-core/playwright`) on key pages.

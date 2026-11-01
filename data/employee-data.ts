// Test data factory: every call returns NEW unique values, so tests never clash
// with each other (parallel runs) or with other people using the shared demo site.

export type Employee = {
  firstName: string;
  lastName: string;
  employeeId: string;
};

export type LoginDetails = {
  username: string;
  password: string;
};

// Short unique text: timestamp in base-36 (8 chars) + 2 random chars.
// Kept at 10 chars because OrangeHRM's Employee Id field allows max 10.
function uniqueSuffix(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
}

// Example: { firstName: 'Auto_John_mvxw7fcx3k', lastName: 'Auto_Smith', employeeId: 'mvxw7fcx3k' }
export function createEmployee(): Employee {
  const unique = uniqueSuffix();
  return {
    firstName: `Auto_John_${unique}`,
    lastName: 'Auto_Smith',
    employeeId: unique,
  };
}

// Example: { username: 'auto_mvxw7fcx3k', password: 'Auto_mvxw7fcx3k_9!' }
// The password is throwaway test data (not a secret) with upper/lower case, a number and a symbol.
export function createLoginDetails(): LoginDetails {
  const unique = uniqueSuffix();
  return {
    username: `auto_${unique}`,
    password: `Auto_${unique}_9!`,
  };
}

// The two system-user roles that exist on the demo site (checked live in Admin > Add User)
export type UserRole = 'Admin' | 'ESS';

// A system user = login details + role + Enabled/Disabled, linked to one employee
export type SystemUser = LoginDetails & {
  role: UserRole;
  enabled: boolean;
};

// Example: { username: 'auto_mvxw7fcx3k', password: 'Auto_mvxw7fcx3k_9!', role: 'ESS', enabled: true }
export function createSystemUser(role: UserRole = 'ESS', enabled = true): SystemUser {
  return { ...createLoginDetails(), role, enabled };
}

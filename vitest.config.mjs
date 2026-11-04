import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    include: [
      'tests/unit/hr-*.test.js',
      'tests/integration/departments.test.js',
      'tests/integration/positions.test.js',
      'tests/integration/employee-profile.test.js',
      'tests/integration/contracts.test.js',
      'tests/integration/permissions.test.js',
      'tests/integration/attendance.test.js',
      'tests/integration/overtime.test.js',
      'tests/integration/rbac.test.js',
      'tests/integration/payroll.test.js',
      'tests/integration/benefits.test.js',
      'tests/integration/evaluations.test.js',
      'tests/integration/hr-dashboard.test.js',
      'tests/integration/hr-users.test.js',
      'tests/integration/hr-app.test.js'
    ]
  }
});

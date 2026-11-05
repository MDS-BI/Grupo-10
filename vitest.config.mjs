import { defineConfig } from 'vitest/config';

// La suite del modulo 002 se ejecuta de forma aislada. Los tests del modulo
// base 001 se conservan intactos en el repositorio, pero no forman parte de
// esta configuracion porque su implementacion no esta incluida en esta entrega.
export default defineConfig({
  test: {
    include: [
      'tests/unit/hr-*.test.js',
      'tests/integration/departments.test.js',
      'tests/integration/positions.test.js',
      'tests/integration/employee-profile.test.js',
      'tests/integration/contracts.test.js',
      'tests/integration/permissions.test.js',
      'tests/integration/attendance.test.js',
      'tests/integration/payroll.test.js',
      'tests/integration/rbac.test.js',
      'tests/integration/overtime.test.js',
      'tests/integration/benefits.test.js',
      'tests/integration/evaluations.test.js',
      'tests/integration/hr-dashboard.test.js'
    ],
    fileParallelism: false,
    environment: 'jsdom'
  }
});

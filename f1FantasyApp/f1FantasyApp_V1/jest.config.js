/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Only pick up backend tests (frontend has its own vitest runner)
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'app.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov'],
  testTimeout: 15000,
  // Automatically clear mock.calls and mock.instances between every test
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
};

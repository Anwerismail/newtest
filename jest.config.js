export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/database/seeds/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default {
  testEnvironment: 'node',
  transform: {},
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/models/**/*.js'],
  coverageDirectory: 'coverage',
};

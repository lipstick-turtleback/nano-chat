import { defineConfig } from 'jest';
// eslint-disable-next-line no-unused-vars
import globals from 'globals';

export default defineConfig({
  testEnvironment: 'node',
  testMatch: ['**/server/__tests__/**/*.test.js'],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 120000,
  globals: {
    jest: true,
    describe: true,
    it: true,
    expect: true,
    beforeAll: true,
    afterAll: true
  }
});

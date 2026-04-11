import { defineConfig } from 'jest';

export default defineConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testMatch: ['**/src/**/__tests__/**/*.test.{js,jsx}', '**/src/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    '^\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/test/**',
    '!src/**/*.stories.{js,jsx}'
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'json']
});

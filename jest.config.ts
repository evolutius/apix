// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(test|spec).ts', '**/?(*.)+(test|spec).ts'],

  // Tell Jest how to transpile TS
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json'
      }
    ]
  },

  // If later you hit ESM-only deps (e.g., redis@5) in tests, unignore them here:
  // transformIgnorePatterns: ['/node_modules/(?!(redis|@redis\\/client)/)'],
};

export default config;
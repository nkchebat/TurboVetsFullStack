const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/?(*.)(spec|test).(js|jsx|ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
    '!src/environments/**',
    '!src/**/*.module.ts',
  ],
  coverageReporters: ['html', 'text-summary', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Enhanced verbose output settings
  verbose: true,
  // Show individual test results with full descriptions
  testRunner: 'jest-circus/runner',
  // Enhanced reporters for better output
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  // Show test descriptions with timing
  displayName: {
    name: 'TurboVets Tests',
    color: 'cyan',
  },
  // Enhanced error display
  errorOnDeprecated: false,
  // Better test output formatting
  maxWorkers: '50%',
  // Clear screen between test runs
  clearMocks: true,
  restoreMocks: true,
};

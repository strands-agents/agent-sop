module.exports = {
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
      setupFiles: ['<rootDir>/test/jest.setup.js'],
      moduleNameMapper: {
        '^react$': 'preact/compat',
        '^react-dom$': 'preact/compat'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
            jsxImportSource: 'preact'
          }
        }],
        '^.+\\.(js|jsx|mjs)$': 'babel-jest'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(preact|@testing-library/preact))'
      ],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
        '<rootDir>/src/**/?(*.)(spec|test).(js|jsx|ts|tsx)',
        '<rootDir>/test/**/!(*.node).test.(js|jsx|ts|tsx)'
      ],
      collectCoverageFrom: [
        'src/**/*.(js|jsx|ts|tsx)',
        '!src/**/*.d.ts',
        '!src/setupTests.js'
      ]
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/test/jest.node.setup.js'],
      testMatch: [
        '<rootDir>/test/**/*.node.test.(js|jsx|ts|tsx)'
      ]
    }
  ]
};

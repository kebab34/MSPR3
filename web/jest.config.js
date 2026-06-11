/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|scss)$": "<rootDir>/__mocks__/styleMock.js",
  },
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/api/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
};

module.exports = config;

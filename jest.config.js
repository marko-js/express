module.exports = {
  preset: "@marko/jest/preset/node",
  testMatch: ["**/__tests__/*.test.ts"],
  transform: {
    "\\.ts$": "ts-jest"
  },
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};

/** @type {import("@jest/types").Config.InitialOptions} */
const config = {
  preset: "@marko/jest/preset/node",
  testMatch: ["**/__tests__/*.test.ts"],
  transform: { "\\.[jt]s$": "es-jest" },
  transformIgnorePatterns: [],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

module.exports = config;

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.jest.json", diagnostics: false }],
  },
  setupFiles: ["<rootDir>/tests/helpers/env.ts"],
  clearMocks: true,
  // Os controllers escrevem muitos console.log/error; silencia para o relatório ficar legível
  silent: true,
};

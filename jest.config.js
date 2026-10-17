const fs = require("fs");
const path = require("path");

// Inclui a pasta "tests" (suíte deste PR) e, se existir, "src/__tests__" (suíte do PR #58,
// US08), para que as duas suítes rodem juntas sem precisar de dois jest.config.js.
const roots = ["<rootDir>/tests"];
if (fs.existsSync(path.join(__dirname, "src", "__tests__"))) {
  roots.push("<rootDir>/src/__tests__");
}

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots,
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.jest.json", diagnostics: false }],
  },
  setupFiles: ["<rootDir>/tests/helpers/env.ts"],
  clearMocks: true,
  // Os controllers escrevem muitos console.log/error; silencia para o relatório ficar legível
  silent: true,
};

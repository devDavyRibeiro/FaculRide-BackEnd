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

  // Cobertura: medida sobre os módulos das histórias de usuário testadas nesta entrega
  // (cadastro, login, perfil, veículos, pesquisa/filtro de caronas, viagem e status da viagem).
  // Módulos ainda sem suíte (chat, avaliação, pagamento, notificações) ficam fora desta conta.
  collectCoverageFrom: [
    "src/controllers/{usuario,veiculo,viagem}.controller.ts",
    "src/routes/{usuario,veiculo}.routes.ts",
    "src/middlewares/authorize.middleware.ts",
    "src/utils/{caronaFilter,viagemStatus}.ts",
    "src/services/blobStorageService.ts",
  ],
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],
  // A pipeline falha se a cobertura desse escopo cair abaixo de 80%.
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};

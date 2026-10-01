/** Configuração mínima do Jest para rodar testes unitários em TypeScript. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/**/__tests__/**/*.test.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
  },
};

/**
 * `bug(...)` registra um defeito CONHECIDO como teste.
 *
 * - Normalmente usa `it.failing`: o teste descreve o comportamento CORRETO (o que o
 *   cartão do Trello pede) e passa enquanto o defeito existir. Assim a pipeline
 *   não quebra. Quando o bug for corrigido, o teste passa a falhar e avisa que é
 *   hora de trocar `bug(` por `it(`.
 * - Rodando `SHOW_BUGS=1 npm test`, vira `it` normal e mostra a falha real,
 *   útil para reproduzir/anexar em um card de bug.
 */
export const bug: typeof it = (process.env.SHOW_BUGS ? it : it.failing) as typeof it;

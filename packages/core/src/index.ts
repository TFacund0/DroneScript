// ─── @dronescript/core ───────────────────────────────────────────────────────
// Frontend del compilador de DroneScript: lexer, parser LL(1), analizador
// semántico y motor de simulación. Sin dependencias de UI ni del navegador.

export * from "./types";
export { Lexer, tokenize } from "./lexer";
export { Parser, parse } from "./parser";
export { analyzeSemantics } from "./semantic";
export { interpretAST, DIR_VECTOR } from "./simulator";
export type { Step, StepKind } from "./simulator";
export { analyze } from "./pipeline";

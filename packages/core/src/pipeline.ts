import { tokenize } from "./lexer";
import { parse } from "./parser";
import { analyzeSemantics } from "./semantic";
import type { AnalyzerResult } from "./types";

/**
 * Ejecuta el pipeline completo del compilador sobre el código fuente:
 * análisis léxico → sintáctico → semántico.
 */
export function analyze(code: string): AnalyzerResult {
  const { tokens, errors: lexErrors } = tokenize(code);
  const { ast, errors: parseErrors } = parse(tokens);
  // La fase semántica solo aporta resultados confiables sobre un AST bien formado
  const semanticIssues =
    lexErrors.length + parseErrors.length === 0 ? analyzeSemantics(ast) : [];
  const semanticErrors = semanticIssues.filter((i) => i.severity === "error");
  const warnings = semanticIssues.filter((i) => i.severity === "warning");
  return {
    tokens,
    ast,
    errors: [...lexErrors, ...parseErrors, ...semanticErrors],
    warnings,
  };
}

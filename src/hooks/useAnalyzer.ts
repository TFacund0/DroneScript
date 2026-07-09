import { useState, useCallback } from "react";
import { tokenize } from "../core/lexer";
import { parse } from "../core/parser";
import { analyzeSemantics } from "../core/semantic";
import { EXAMPLE } from "../constants/exampleCode";
import type { AnalyzerResult, TabId } from "../types";

export function useAnalyzer() {
  const [code, setCode] = useState<string>(EXAMPLE);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [tab, setTab] = useState<TabId>("tokens");

  const analyze = useCallback(() => {
    const { tokens, errors: lexErrors } = tokenize(code);
    const { ast, errors: parseErrors } = parse(tokens);
    // La fase semántica solo aporta resultados confiables sobre un AST bien formado
    const semanticIssues =
      lexErrors.length + parseErrors.length === 0 ? analyzeSemantics(ast) : [];
    const semanticErrors = semanticIssues.filter((i) => i.severity === "error");
    const warnings = semanticIssues.filter((i) => i.severity === "warning");
    const errors = [...lexErrors, ...parseErrors, ...semanticErrors];
    setResult({ tokens, ast, errors, warnings });
    setTab(errors.length > 0 ? "errores" : "tokens");
  }, [code]);

  return { code, setCode, result, tab, setTab, analyze };
}

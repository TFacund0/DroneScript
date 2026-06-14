import { useState, useCallback } from "react";
import { tokenize } from "../core/lexer";
import { parse } from "../core/parser";
import { EXAMPLE } from "../constants/exampleCode";

export function useAnalyzer() {
  const [code, setCode] = useState(EXAMPLE);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('tokens'); // 'tokens' | 'ast' | 'errores'

  const analyze = useCallback(() => {
    const { tokens, errors: lexErrors } = tokenize(code);
    const { ast, errors: parseErrors } = parse(tokens);
    setResult({ tokens, ast, errors: [...lexErrors, ...parseErrors] });
    setTab(lexErrors.length + parseErrors.length > 0 ? 'errores' : 'tokens');
  }, [code]);

  return {
    code,
    setCode,
    result,
    tab,
    setTab,
    analyze
  };
}

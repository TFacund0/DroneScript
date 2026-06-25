import { useState, useCallback } from 'react';
import { tokenize } from '../core/lexer';
import { parse } from '../core/parser';
import { EXAMPLE } from '../constants/exampleCode';
import type { AnalyzerResult, TabId } from '../types';

export function useAnalyzer() {
  const [code, setCode] = useState<string>(EXAMPLE);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [tab, setTab] = useState<TabId>('tokens');

  const analyze = useCallback(() => {
    const { tokens, errors: lexErrors } = tokenize(code);
    const { ast, errors: parseErrors } = parse(tokens);
    setResult({ tokens, ast, errors: [...lexErrors, ...parseErrors] });
    setTab(lexErrors.length + parseErrors.length > 0 ? 'errores' : 'tokens');
  }, [code]);

  return { code, setCode, result, tab, setTab, analyze };
}

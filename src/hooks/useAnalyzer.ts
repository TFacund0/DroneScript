import { useState, useCallback } from "react";
import { analyze as runPipeline, type AnalyzerResult } from "@dronescript/core";
import { EXAMPLE } from "../constants/exampleCode";
import type { TabId } from "../types";

export function useAnalyzer() {
  const [code, setCode] = useState<string>(EXAMPLE);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [tab, setTab] = useState<TabId>("tokens");

  const analyze = useCallback(() => {
    const pipelineResult = runPipeline(code);
    setResult(pipelineResult);
    setTab(pipelineResult.errors.length > 0 ? "errores" : "tokens");
  }, [code]);

  return { code, setCode, result, tab, setTab, analyze };
}
